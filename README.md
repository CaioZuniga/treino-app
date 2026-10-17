# treino-app

PWA que monta treino de musculação, aeróbico e mobilidade de acordo com o seu perfil e com os equipamentos de cada ambiente onde você treina. Os dados ficam no seu aparelho.

App publicado: https://caiozuniga.github.io/treino-app/

O plano completo está em [PLANO.md](PLANO.md).

## Rodar localmente

```bash
npm install
npm run dev
```

## Testes e build

```bash
npm test
npm run build
```

Cada push na `main` publica o app no GitHub Pages pelo workflow `.github/workflows/deploy.yml`.

Dados de exercícios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público).
