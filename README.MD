# Rinha de Backend 2025 - Node.js

## Visão Geral

Este projeto é uma API de processamento de pagamentos de alta performance, desenvolvida para a competição Rinha de Backend 2025. O foco é maximizar throughput e eficiência de recursos, utilizando Node.js, TypeScript e técnicas de otimização.

## Arquitetura

- **Cluster de APIs**: Dois containers (`api1` e `api2`) rodam a mesma aplicação, comunicando-se via Unix Socket baixo overhead de rede.
- **Worker Threads**: Processamento de pagamentos é feito em workers, permitindo uso eficiente de múltiplos núcleos.
- **Bit Packing**: Armazenamento dos pagamentos em memória usando packing de bits para reduzir uso de memória e acelerar consultas.
- **Comunicação entre instâncias**: Cada instância consulta o "estado estrangeiro" da outra para sumarização global, via HTTP interno.

## Técnicas de Performance

- **Bit Packing**: Pagamentos são armazenados como inteiros compactados, otimizando uso de memória e cache.
- **Pool de Conexões HTTP**: Uso do `undici` para pools HTTP, pré-aquecendo conexões para processadores de pagamento.
- **Workers**: Uso de `worker_threads` para processamento paralelo sem bloquear o event loop principal.
- **Zero dependências pesadas**: Apenas dependências essenciais, evitando frameworks pesados.

## Endpoints

- `POST /payments`: Enfileira um novo pagamento.
- `GET /payments-summary`: Retorna sumário dos pagamentos (local e global).
- `POST /purge-payments`: Limpa o estado em memória.

## Estrutura de Pastas

- `src/`
  - `main.ts`: Bootstrap da aplicação.
  - `config/`: Configurações de ambiente, server e fila.
  - `controllers/`: Handlers HTTP.
  - `services/`: Lógica de negócio (processamento, sumário, integração externa).
  - `state/`: Armazenamento em memória otimizado (bit packing).
  - `workers/`: Worker thread para processamento de pagamentos.
  - `shared/`: Utilitários (conversão de dinheiro, helpers HTTP).

## Como rodar

```bash
docker-compose up --build
```
