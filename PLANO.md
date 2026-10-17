# Plano — treino-app

App (PWA) que monta treino de musculação, aeróbico e mobilidade a partir das características da pessoa e dos equipamentos do ambiente onde ela treina.

Protótipo visual aprovado: https://claude.ai/artifact/BxhhCJnJRV5mq3JUhaNnkL (dark premium neon).

## Decisões

| Área | Decisão |
|---|---|
| Plataforma | Web app / PWA instalável, publicado no GitHub Pages |
| Dados | IndexedDB (Dexie) no aparelho + exportar/importar backup em JSON |
| Motor | Só regras (sem IA), testado com Vitest |
| Exercícios | free-exercise-db (domínio público), curadoria de ~250 exercícios traduzidos |
| Perfil | Idade, sexo, peso, altura, nível, lesões, objetivo, dias/semana, minutos/sessão, preferências |
| Equipamentos | **Ambientes de treino** (Ambiente 1, 2…), cada um com checklist completo |
| Divisão | A pessoa escolhe (Full body, ABC, Upper/Lower, PPL, ABCD) |
| Aeróbico | Definido pelo objetivo |
| Mobilidade | Aquecimento específico de 5–8 min, focado nas articulações do dia e nas lesões |
| Visual | Dark premium neon: lima (musculação), laranja (aeróbico), lilás (mobilidade) |

## Stack

React 19 + Vite + TypeScript · Tailwind v4 · Framer Motion · Dexie · vite-plugin-pwa · Vitest · HashRouter.

## Modelo de dados

Definido em `src/types.ts`.

- `Profile`: dados físicos, nível, lesões, objetivo, rotina, divisão, preferências, ambiente ativo.
- `Environment`: nome, ícone, ids de equipamentos (`src/data/equipment.ts`).
- `Exercise` (Fase 1): nome PT, músculos primários e secundários, padrão de movimento, equipamentos exigidos, nível, tags de contraindicação, imagens, instruções.
- `Program`: divisão, ambiente e sessões (blocos de mobilidade, musculação e aeróbico).
- `WorkoutLog`: séries realizadas (carga, repetições, concluída), duração, kcal.

## Motor de regras

1. **Modelo da divisão**: cada dia da divisão escolhida tem "vagas" (ex.: Inferiores = composto de quadríceps, dobradiça de quadril, unilateral, isolador de quadríceps, glúteo).
2. **Preenchimento**: filtra por equipamento do ambiente, nível e lesões; tira o que a pessoa evita; ordena por favoritos, prioridade de compostos e variação entre semanas.
3. **Volume e intensidade**:
   - Séries por músculo na semana: iniciante 8–10, intermediário 12–16, avançado 16–20.
   - Hipertrofia: 8–12 repetições, 90 s de descanso.
   - Força: 3–6 repetições, 3 min.
   - Emagrecimento: 10–15 repetições, 60 s.
   - Condicionamento: circuito.
4. **Tempo**: estima a duração (`src/engine/session.ts`) e corta acessórios até caber no tempo informado.
5. **Aeróbico**:
   - Emagrecimento: 2× HIIT + 2× LISS por semana.
   - Hipertrofia: LISS leve.
   - Aparelho vem do ambiente; sem aparelho, corda ou peso corporal.
   - Zonas de FC pela fórmula de Tanaka (FCmáx = 208 − 0,7 × idade).
6. **Mobilidade**: 5–8 min pelas articulações do dia e pelas lesões.
7. **Progressão dupla**: todas as séries no topo da faixa → +2,5 kg (superiores) / +5 kg (inferiores). Duas falhas seguidas → −10% (deload).
8. **Trocar exercício**: mesma vaga e mesmo padrão de movimento, dentro do ambiente.
9. **Calorias**: MET × peso × tempo.

## Telas

Onboarding, Hoje, Semana, Treino, Detalhe do exercício, Ao vivo, Resumo pós-treino, Ambientes, Progresso, Perfil.

## Fases

| # | Fase | Entrega | Status |
|---|---|---|---|
| 0 | Setup | Repo, Vite + PWA, tokens visuais, navegação, banco local, deploy | Feito |
| 1 | Curadoria dos dados | 293 exercícios traduzidos, ligados ao checklist de equipamentos, com tags de lesão (`data/curadoria.txt`, `npm run build:exercises`) | Feito |
| 2 | Motor | Regras 1–9 com testes | |
| 3 | Telas base | Onboarding, ambientes, perfil, hoje, semana, treino, detalhe | |
| 4 | Execução | Ao vivo, registro, resumo, progressão, gráficos | |
| 5 | Publicação | Cache offline das imagens, ícones PNG (iOS), backup, polimento | |

## Aviso

O app mostra que não substitui orientação de um profissional de educação física, principalmente quando há lesão informada.
