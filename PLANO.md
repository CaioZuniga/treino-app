# Plano — treino-app

App (PWA) que monta treino de musculação, aeróbico e mobilidade a partir das características da pessoa e dos equipamentos do ambiente onde ela treina.

Protótipo visual aprovado: https://claude.ai/artifact/BxhhCJnJRV5mq3JUhaNnkL (dark premium neon).

## Decisões

| Área | Decisão |
|---|---|
| Plataforma | Web app / PWA instalável no iPhone e no Android, publicado no GitHub Pages |
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

Código em `src/engine/`, testes em `src/engine/engine.test.ts` (todas as 180 combinações de divisão × objetivo × nível × ambiente-base).

1. **Modelo da divisão** (`splits.ts`): cada dia tem vagas em ordem, com prioridade principal, secundária ou acessório. Se nada cabe no ambiente, tenta substitutos do mesmo grupo e, por último, qualquer exercício da mesma região ou de core. O foco muscular escolhido vira uma vaga secundária extra nos dias da região.
2. **Preenchimento** (`select.ts`):
   - Filtra por ambiente, nível (iniciante só recebe exercícios de iniciante), lesões e exercícios evitados.
   - Pontua: favoritos +4; clássicos com carga +1,5; composto em vaga principal +2; isolado em acessório +1.
   - Na academia, peso do corpo e elástico perdem 2 pontos. Exercício já usado em outro dia perde 3.
   - Uma variação estável pela semente fecha a ordenação.
3. **Volume e intensidade** (`prescription.ts`):

   | Séries | Principal | Secundário | Acessório |
   |---|---|---|---|
   | Iniciante | 3 | 3 | 2 |
   | Intermediário | 4 | 3 | 3 |
   | Avançado | 4 | 4 | 3 |

   | Reps / descanso | Principal | Secundário | Acessório |
   |---|---|---|---|
   | Hipertrofia | 6–10 / 120 s | 8–12 / 90 s | 10–15 / 60 s |
   | Força | 3–6 / 180 s | 6–8 / 120 s | 8–12 / 90 s |
   | Emagrecimento | 8–12 / 75 s | 10–15 / 60 s | 12–15 / 45 s |
   | Condicionamento | 10–12 / 60 s | 12–15 / 45 s | 15–20 / 30 s |

   Core usa 10–15 repetições com 45 s; prancha e sustentações são em segundos.
4. **Tempo** (`session.ts`, `generate.ts`): estima a sessão com cerca de 3 s por repetição, os descansos e 1 min de troca entre exercícios. Para caber no tempo informado, corta nesta ordem: acessórios do fim, séries extras dos não principais (até 2), minutos de aeróbico (até 10), aquecimento (até 3 movimentos) e secundários do fim. Nunca fica com menos de 3 exercícios.
5. **Aeróbico** (`cardio.ts`):
   - Emagrecimento: HIIT e LISS alternados em toda sessão.
   - Condicionamento: HIIT em toda sessão.
   - Hipertrofia (15 min) e força (10 min): 2 LISS, fora dos dias de perna.
   - HIIT: 30 s forte / 60 s leve (iniciante 20/70), a 85–90% da FC máxima. LISS: zona 2, a 60–70%. FC máxima pela fórmula de Tanaka (208 − 0,7 × idade).
   - Sem aparelho: circuito de condicionamento (40 s de esforço / 20 s de pausa).
6. **Mobilidade** (`mobility.ts`): de 4 a 5 exercícios, 2 séries cada. Primeiro as articulações das lesões, depois as mais usadas no dia, preferindo movimentos dinâmicos.
7. **Progressão dupla** (`progression.ts`):
   - Todas as séries no topo da faixa → +5 kg em agachamento, dobradiça e glúteo compostos; +2,5 kg nos demais.
   - Abaixo do mínimo em 2 sessões seguidas → −10% (deload).
   - Arredonda para 0,5 kg.
8. **Trocar exercício** (`alternatives`): mesmo padrão, dentro do ambiente, seguro, fora da sessão, ordenado pela mesma pontuação.
9. **Calorias**: MET × peso × tempo (musculação 5, mobilidade 2,5, HIIT e circuito 8, LISS 4,5).

## Telas

Onboarding, Hoje, Semana, Treino, Detalhe do exercício, Ao vivo, Resumo pós-treino, Ambientes, Progresso, Perfil.

## Fases

| # | Fase | Entrega | Status |
|---|---|---|---|
| 0 | Setup | Repo, Vite + PWA, tokens visuais, navegação, banco local, deploy | Feito |
| 1 | Curadoria dos dados | 293 exercícios traduzidos, ligados ao checklist de equipamentos, com tags de lesão (`data/curadoria.txt`, `npm run build:exercises`) | Feito |
| 2 | Motor | Regras 1–9 com testes (`src/engine`) | Feito |
| 3 | Telas base | Onboarding, ambientes, perfil, hoje, semana, treino (com troca), detalhe | Feito |
| 4 | Execução | Ao vivo (séries, carga sugerida, timer de descanso, aeróbico, progresso salvo), resumo com recordes, aba Progresso com gráfico e histórico | Feito |
| 5 | Publicação | iPhone e Android: ícones PNG e maskable, metatags do iOS, fontes locais, offline (app e fotos), instalar app, backup pela folha de compartilhar, ajustes de toque, zoom e áudio, transições | Feito |

## Aviso

O app mostra que não substitui orientação de um profissional de educação física, principalmente quando há lesão informada.
