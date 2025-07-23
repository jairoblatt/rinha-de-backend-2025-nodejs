// curl --unix-socket /tmp/app.sock http://localhost/

// NOVO PAGAMENTO
// curl http://localhost:9999/payments -X POST -H "Content-Type: application/json" -d '{"correlationId": "4a7901b8-7d26-4d9d-aa19-4dc1c7cf60b3", "amount": 19.90}'
// curl --unix-socket /tmp/app.sock http://localhost/payments -X POST -H "Content-Type: application/json" -d '{"correlationId": "4a7901b8-7d26-4d9d-aa19-4dc1c7cf60b3", "amount": 19.90}'

// SUMARIO
// curl http://localhost:9999/payments-summary?to=123\&from=456
// curl --unix-socket /tmp/app.sock http://localhost/payments-summary?to=123\&from=456
