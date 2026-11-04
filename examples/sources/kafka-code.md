# Example software change record (synthetic)
Commit abc123 changes OrderService producer delivery.timeout.ms to 300000.
OrderService is configured to publish OrderCreated.
OrderCreated is declared on broker topic orders.created.
delivery.timeout.ms configures the OrderService producer.
Declared configuration is not proof of successful runtime delivery or persistence.
