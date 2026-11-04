// Ontology Engineering Skills: portable schema and evidence-graph engine.
// No external dependencies; no inference, network I/O, or code execution from source content.
const API_VERSION="oes/v1";
const GRAPH_VERSION="oes.graph/v1";
const PROPERTY_TYPES={"string":"string","integer":"number","number":"number","boolean":"boolean","array":"object","object":"object"};
const CARDINALITIES=["one-to-one","one-to-many","many-to-one","many-to-many"];
const STATUSES=["asserted","verified","inferred","hypothesis"];

function diagnostic(severity, code, path, message){return {severity,code,path,message};}

function ancestry(type, defs){
  const lineage=[],seen=new Set();
  while(type && defs[type]){
    if(seen.has(type))throw new Error(`cyclic type hierarchy: ${type}`);
    seen.add(type);lineage.push(type);type=defs[type].parent;
  }
  return lineage;
}

function isSubtype(actual,allowed,defs){
  return allowed.includes("*") || ancestry(actual,defs).some(t=>allowed.includes(t));
}

function effectiveProperties(type,defs){
  const props={};
  for(const parent of ancestry(type,defs).reverse())Object.assign(props,defs[parent].properties||{});
  return props;
}

function typeValid(value,type){
  if(type==="string")return typeof value==="string";
  if(type==="integer")return typeof value==="number"&&Number.isInteger(value);
  if(type==="number")return typeof value==="number"&&Number.isFinite(value);
  if(type==="boolean")return typeof value==="boolean";
  if(type==="array")return Array.isArray(value);
  if(type==="object")return !!value&&typeof value==="object"&&!Array.isArray(value);
  return false;
}

function validateProperties(properties,requirements,path,issues){
  if(!properties||typeof properties!=="object"||Array.isArray(properties)){
    issues.push(diagnostic("error","invalid-properties",path,"properties must be an object"));return;
  }
  for(const [name,rule] of Object.entries(requirements||{})){
    const p=path+"."+name;
    if(!(name in properties)){
      if(rule.required)issues.push(diagnostic("error","missing-property",p,"required property is missing"));
    }else if(!typeValid(properties[name],rule.type||"string")){
      issues.push(diagnostic("error","property-type",p,`expected ${rule.type}`));
    }else if(rule.enum && !rule.enum.some(value=>canonicalJSON(value)===canonicalJSON(properties[name]))){
      issues.push(diagnostic("error","property-enum",p,"value not in enum"));
    }
  }
}

// Compare JSON structure, not insertion order. Array order remains significant;
// this is NOT a semantic equivalence reasoner or RFC 8785 implementation.
function canonicalJSON(value){
  if(Array.isArray(value))return '['+value.map(canonicalJSON).join(',')+']';
  if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalJSON(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
function edgeKey(type,id){return JSON.stringify([type,id]);}
// A supportedBy edge is already a citation. It need not cite itself again.
function edgeEvidenceIds(edge,nodes){
  if(edge.evidenceIds!==undefined)return edge.evidenceIds;
  return edge.type==='supportedBy'&&nodes.get(edge.to)?.type==='Evidence'?[edge.to]:[];
}

function compileTemplate(id,registry,stack=[]){
  if(stack.includes(id))throw new Error(`template cycle: ${[...stack,id].join(" -> ")}`);
  const raw=registry[id];if(!raw)throw new Error(`unknown ontology template: ${id}`);
  if(raw.apiVersion!==API_VERSION||raw.kind!=="OntologyTemplate")throw new Error(`invalid header for ${id}`);
  const output={apiVersion:API_VERSION,kind:"OntologyTemplate",metadata:raw.metadata,entityTypes:{},relationTypes:{},constraints:[]};
  function mergeSection(section,source,where){
    for(const [name,definition] of Object.entries(source||{})){
      if(name in output[section] && canonicalJSON(output[section][name])!==canonicalJSON(definition)){
        throw new Error(`${section}.${name} conflicts with ${where}; rename or align explicitly`);
      }
      output[section][name]=definition;
    }
  }
  for(const parent of raw.extends||[]){
    const compiled=compileTemplate(parent,registry,[...stack,id]);
    mergeSection("entityTypes",compiled.entityTypes,parent);
    mergeSection("relationTypes",compiled.relationTypes,parent);
    for(const constraint of compiled.constraints){
      const existing=output.constraints.find(c=>c.id===constraint.id);
      if(existing&&canonicalJSON(existing)!==canonicalJSON(constraint))throw new Error(`constraint ${constraint.id} conflicts with ${parent}`);
      if(!existing)output.constraints.push(constraint);
    }
  }
  mergeSection("entityTypes",raw.entityTypes,id);
  mergeSection("relationTypes",raw.relationTypes,id);
  for(const constraint of raw.constraints||[]){
    if(output.constraints.some(c=>c.id===constraint.id))throw new Error(`duplicate constraint id ${constraint.id}`);
    output.constraints.push(constraint);
  }
  return output;
}

function validatePropertyRules(properties,path,issues){
  if(properties===undefined)return;
  if(!properties||typeof properties!=="object"||Array.isArray(properties)){
    issues.push(diagnostic("error","invalid-property-rules",path,"property rules must be an object"));return;
  }
  for(const [field,rule] of Object.entries(properties)){
    const p=path+"."+field;
    if(!rule||typeof rule!=="object"||Array.isArray(rule)){
      issues.push(diagnostic("error","invalid-property-rule",p,"property rule must be an object"));continue;
    }
    if(!Object.hasOwn(PROPERTY_TYPES,rule.type)){
      issues.push(diagnostic("error","unknown-property-type",p,String(rule.type)));continue;
    }
    if("required" in rule&&typeof rule.required!=="boolean"){
      issues.push(diagnostic("error","invalid-required",p+".required","required must be a boolean"));
    }
    if("enum" in rule){
      if(!Array.isArray(rule.enum)||!rule.enum.length){
        issues.push(diagnostic("error","invalid-enum",p+".enum","enum must be a nonempty array"));
      }else if(rule.enum.some(value=>!typeValid(value,rule.type))){
        issues.push(diagnostic("error","invalid-enum-value",p+".enum",`enum values must have type ${rule.type}`));
      }
    }
  }
}

function validateTemplate(schema){
  const issues=[];
  if(schema.apiVersion!==API_VERSION||schema.kind!=="OntologyTemplate")issues.push(diagnostic("error","template-header","$","invalid template version/kind"));
  const types=schema.entityTypes||{},relations=schema.relationTypes||{};
  if(!Object.keys(types).length || !Object.keys(relations).length)issues.push(diagnostic("error","empty-template","$","entityTypes and relationTypes are required"));
  for(const [name,definition] of Object.entries(types)){
    if(!definition||typeof definition!=="object"||Array.isArray(definition)){
      issues.push(diagnostic("error","invalid-entity-definition",`entityTypes.${name}`,"entity definition must be an object"));continue;
    }
    if(definition.parent&&!types[definition.parent])issues.push(diagnostic("error","unknown-parent",`entityTypes.${name}`,definition.parent));
    try{ancestry(name,types);}catch(e){issues.push(diagnostic("error","type-cycle",`entityTypes.${name}`,e.message));}
    validatePropertyRules(definition.properties,`entityTypes.${name}.properties`,issues);
  }
  for(const [name,rel] of Object.entries(relations)){
    if(!rel||typeof rel!=="object"||Array.isArray(rel)){
      issues.push(diagnostic("error","invalid-relation-definition",`relationTypes.${name}`,"relation definition must be an object"));continue;
    }
    for(const side of ["from","to"]){
      if(!Array.isArray(rel[side]) || !rel[side].length || rel[side].some(t=>t!=="*"&&!types[t]))issues.push(diagnostic("error","invalid-endpoints",`relationTypes.${name}.${side}`,"unknown or missing endpoint types"));
    }
    if(!CARDINALITIES.includes(rel.cardinality||"many-to-many"))issues.push(diagnostic("error","invalid-cardinality",`relationTypes.${name}`,String(rel.cardinality)));
    if(rel.inverse&&(!relations[rel.inverse]||relations[rel.inverse].inverse!==name))issues.push(diagnostic("error","inverse-mismatch",`relationTypes.${name}`,`inverse must reciprocally declare ${name}`));
    validatePropertyRules(rel.properties,`relationTypes.${name}.properties`,issues);
  }
  for(const c of schema.constraints||[]){
    if(c.kind!=="requiresEdge"||!types[c.nodeType]||!relations[c.edgeType]||!["in","out"].includes(c.direction||"out")||!["warning","error"].includes(c.severity||"warning")){
      issues.push(diagnostic("error","invalid-constraint",`constraints.${c.id||"?"}`,"only valid requiresEdge constraints are supported"));
    }
  }
  return issues;
}

function validateGraph(graph,schema){
  const issues=validateTemplate(schema),types=schema.entityTypes||{},rels=schema.relationTypes||{};
  if(issues.some(x=>x.severity==="error"))return issues;
  if(graph.apiVersion!==GRAPH_VERSION)issues.push(diagnostic("error","graph-version","apiVersion",`expected ${GRAPH_VERSION}`));
  const nodes=new Map(),ids=new Set(),out=new Map(),incoming=new Map(),edges=Array.isArray(graph.edges)?graph.edges:[];
  if(!Array.isArray(graph.nodes))issues.push(diagnostic("error","nodes-array","nodes","expected an array"));
  if(!Array.isArray(graph.edges))issues.push(diagnostic("error","edges-array","edges","expected an array"));
  for(const [i,node] of (Array.isArray(graph.nodes)?graph.nodes:[]).entries()){
    const path=`nodes[${i}]`;
    if(!node||typeof node.id!=="string"||!node.id){issues.push(diagnostic("error","node-id",path,"id must be a nonempty string"));continue;}
    if(ids.has(node.id))issues.push(diagnostic("error","duplicate-id",path,node.id));
    ids.add(node.id);nodes.set(node.id,node);
    if(!types[node.type])issues.push(diagnostic("error","unknown-node-type",path,String(node.type)));
    else validateProperties(node.properties||{},effectiveProperties(node.type,types),path+".properties",issues);
  }
  for(const [i,edge] of edges.entries()){
    const path=`edges[${i}]`;
    if(!edge||typeof edge.id!=="string"||!edge.id){issues.push(diagnostic("error","edge-id",path,"id must be a nonempty string"));continue;}
    if(ids.has(edge.id))issues.push(diagnostic("error","duplicate-id",path,edge.id));ids.add(edge.id);
    const r=rels[edge.type],a=nodes.get(edge.from),b=nodes.get(edge.to);
    if(!r)issues.push(diagnostic("error","unknown-relation",path,String(edge.type)));
    if(!a||!b)issues.push(diagnostic("error","dangling-edge",path,"unknown from/to node"));
    if(r&&a&&b){
      if(types[a.type]&&!isSubtype(a.type,r.from,types))issues.push(diagnostic("error","invalid-source-type",path,String(a.type)));
      if(types[b.type]&&!isSubtype(b.type,r.to,types))issues.push(diagnostic("error","invalid-target-type",path,String(b.type)));
      if(edge.from===edge.to&&!r.allowSelf)issues.push(diagnostic("error","self-link",path,"self relation not permitted"));
      validateProperties(edge.properties||{},r.properties||{},path+".properties",issues);
      const ko=edgeKey(edge.type,edge.from),ki=edgeKey(edge.type,edge.to);
      out.set(ko,(out.get(ko)||0)+1);incoming.set(ki,(incoming.get(ki)||0)+1);
    }
    const status=edge.assertionStatus||"asserted",evidenceIds=edgeEvidenceIds(edge,nodes);
    if(!STATUSES.includes(status))issues.push(diagnostic("error","invalid-assertion",path,String(status)));
    if(status!=="verified"&&(!Array.isArray(evidenceIds)||!evidenceIds.length))issues.push(diagnostic("error","missing-evidence",path,"asserted/inferred/hypothesis edges need evidenceIds"));
    if(status==="verified"&&(!Array.isArray(evidenceIds)||!evidenceIds.length))issues.push(diagnostic("warning","untraced-verified",path,"verified edge has no evidence"));
    if("confidence" in edge&&(!typeValid(edge.confidence,"number")||edge.confidence<0||edge.confidence>1))issues.push(diagnostic("error","invalid-confidence",path,"expected 0..1"));
    for(const field of ["validFrom","validTo"]){
      if(field in edge){
        const s=edge[field];
        const okay=typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
        if(!okay)issues.push(diagnostic("error","invalid-date",`${path}.${field}`,"expected an ISO calendar date"));
      }
    }
    if(edge.validFrom&&edge.validTo&&edge.validFrom>edge.validTo)issues.push(diagnostic("error","invalid-validity",path,"validFrom later than validTo"));
  }
  for(const [i,edge] of edges.entries()){
    if(!edge||!rels[edge.type])continue;
    const cardinality=rels[edge.type].cardinality||"many-to-many";
    if(["one-to-one","many-to-one"].includes(cardinality)&&(out.get(edgeKey(edge.type,edge.from))||0)>1)issues.push(diagnostic("error","cardinality-out",`edges[${i}]`,"too many targets for this source"));
    if(["one-to-one","one-to-many"].includes(cardinality)&&(incoming.get(edgeKey(edge.type,edge.to))||0)>1)issues.push(diagnostic("error","cardinality-in",`edges[${i}]`,"too many sources for this target"));
  }
  function checkEvidence(refs,path){
    if(refs===undefined)return;
    if(!Array.isArray(refs)){issues.push(diagnostic("error","evidence-array",path,"evidenceIds must be an array"));return;}
    for(const id of refs)if(nodes.get(id)?.type!=="Evidence")issues.push(diagnostic("error","unknown-evidence",path,String(id)));
  }
  for(const [i,node] of (Array.isArray(graph.nodes)?graph.nodes:[]).entries()){
    if(!node)continue;
    if(node.type==="Evidence"&&nodes.get(node.properties?.sourceId)?.type!=="Source")issues.push(diagnostic("error","evidence-source",`nodes[${i}]`,"Evidence.sourceId must identify a Source node"));
    checkEvidence(node.evidenceIds,`nodes[${i}]`);
  }
  for(const [i,edge] of edges.entries())if(edge)checkEvidence(edgeEvidenceIds(edge,nodes),`edges[${i}]`);
  for(const c of schema.constraints||[]){
    for(const node of nodes.values()){
      if(!types[node.type]||!isSubtype(node.type,[c.nodeType],types))continue;
      const counts=c.direction==="in"?incoming:out;
      if(!(counts.get(edgeKey(c.edgeType,node.id))>0))issues.push(diagnostic(c.severity||"warning","constraint-"+c.id,node.id,`requires ${c.direction||"out"} ${c.edgeType} edge`));
    }
  }
  return issues;
}

function exportJSONLD(graph){
  const nodes=new Map((graph.nodes||[]).map(n=>[n.id,n]));
  const nodeRef=id=>"urn:oes:node:"+id;
  const entities=(graph.nodes||[]).map(n=>{
    const x={"@id":nodeRef(n.id),"@type":"oes:"+n.type};
    for(const [key,value] of Object.entries(n.properties||{}))x["oes:"+key]=value;
    if(n.evidenceIds?.length)x["oes:evidence"]=n.evidenceIds.map(id=>({"@id":nodeRef(id)}));
    return x;
  });
  const assertions=(graph.edges||[]).map(e=>{
    const x={"@id":"urn:oes:edge:"+e.id,"@type":"oes:RelationAssertion","oes:predicate":e.type,"oes:subject":{"@id":nodeRef(e.from)},"oes:object":{"@id":nodeRef(e.to)},"oes:assertionStatus":e.assertionStatus||"asserted"};
    for(const key of ["confidence","validFrom","validTo"])if(key in e)x["oes:"+key]=e[key];
    const evidenceIds=edgeEvidenceIds(e,nodes);
    if(evidenceIds?.length)x["oes:evidence"]=evidenceIds.map(id=>({"@id":nodeRef(id)}));
    for(const [key,value] of Object.entries(e.properties||{}))x["oes:"+key]=value;
    return x;
  });
  return {"@context":{"oes":"https://github.com/philngt/oes#"},"@graph":[...entities,...assertions]};
}

function exportDOT(graph){
  const q=v=>JSON.stringify(String(v));
  const lines=["digraph ontology {","  rankdir=LR;"];
  for(const n of graph.nodes||[])lines.push(`  ${q(n.id)} [label=${q((n.properties?.label||n.id)+" : "+n.type)}];`);
  for(const e of graph.edges||[])lines.push(`  ${q(e.from)} -> ${q(e.to)} [label=${q(e.type)}];`);
  return [...lines,"}",""].join("\n");
}

export {canonicalJSON,compileTemplate,validateTemplate,validateGraph,exportJSONLD,exportDOT};
