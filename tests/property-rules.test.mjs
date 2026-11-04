import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTemplate,validateGraph} from '../lib/engine.mjs';

function fixture(rule,relation=false){
  const schema={apiVersion:'oes/v1',kind:'OntologyTemplate',
    entityTypes:{Item:{properties:relation?{}:{state:rule}}},
    relationTypes:{links:{from:['Item'],to:['Item'],properties:relation?{state:rule}:{}}},
    constraints:[]};
  const graph={apiVersion:'oes.graph/v1',nodes:[
    {id:'a',type:'Item',properties:relation?{}:{state:'o'}},
    {id:'b',type:'Item',properties:relation?{}:{state:'o'}},
  ],edges:relation?[{id:'link',type:'links',from:'a',to:'b',properties:{state:'o'},assertionStatus:'verified'}]:[]};
  return {schema,graph};
}

for(const relation of [false,true]){
  const target=relation?'relation':'entity';
  for(const [label,rule,code] of [
    ['string enum',{type:'string',enum:'open'},'invalid-enum'],
    ['numeric enum',{type:'string',enum:1},'invalid-enum'],
    ['null enum',{type:'string',enum:null},'invalid-enum'],
    ['empty enum',{type:'string',enum:[]},'invalid-enum'],
    ['wrong enum value type',{type:'string',enum:['open',1]},'invalid-enum-value'],
    ['fractional integer enum',{type:'integer',enum:[1.5]},'invalid-enum-value'],
    ['null rule',null,'invalid-property-rule'],
    ['array rule',[],'invalid-property-rule'],
    ['nonboolean required',{type:'string',required:'false'},'invalid-required'],
    ['prototype type',{type:'toString'},'unknown-property-type'],
  ]){
    test(`${target} ${label} returns diagnostics before graph evaluation`,()=>{
      const {schema,graph}=fixture(rule,relation);
      assert.ok(validateTemplate(schema).some(d=>d.code===code));
      assert.doesNotThrow(()=>validateGraph(graph,schema));
      assert.ok(validateGraph(graph,schema).some(d=>d.code===code));
    });
  }
  test(`${target} enum matches full value, not a substring`,()=>{
    const {schema,graph}=fixture({type:'string',enum:['open','closed']},relation);
    assert.deepEqual(validateTemplate(schema),[]);
    assert.ok(validateGraph(graph,schema).some(d=>d.code==='property-enum'));
    for(const node of graph.nodes)node.properties={state:'open'};
    for(const edge of graph.edges)edge.properties={state:'closed'};
    assert.ok(!validateGraph(graph,schema).some(d=>d.severity==='error'));
  });
  test(`${target} enum compares structured JSON values independently of object key order`,()=>{
    const {schema,graph}=fixture({type:'object',enum:[{a:1,b:2}]},relation);
    for(const node of graph.nodes)node.properties={state:{b:2,a:1}};
    for(const edge of graph.edges)edge.properties={state:{b:2,a:1}};
    assert.ok(!validateGraph(graph,schema).some(d=>d.severity==='error'));
    if(relation)graph.edges[0].properties.state={a:1,b:3};
    else graph.nodes[0].properties.state={a:1,b:3};
    assert.ok(validateGraph(graph,schema).some(d=>d.code==='property-enum'));
  });
}
