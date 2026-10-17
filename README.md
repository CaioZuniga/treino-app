# treino-app

App que monta treino de musculação, aeróbico e mobilidade de acordo com o seu perfil e com os equipamentos de cada ambiente onde você treina. Funciona no iPhone e no Android, instalado na tela de início, e também sem internet. Os dados ficam só no seu aparelho.

App publicado: https://caiozuniga.github.io/treino-app/

O plano completo e as regras do motor estão em [PLANO.md](PLANO.md).

## Instalar no celular

Ao abrir o link no navegador do celular, a primeira tela é **Instale o Treino**, antes do cadastro. Instale, abra pelo ícone e faça o cadastro já no app. No iPhone isso é obrigatório para não cadastrar duas vezes: o Safari e o app instalado guardam os dados separados.

**iPhone (Safari)**
1. Abra o endereço acima no Safari.
2. Toque em Compartilhar (quadrado com seta para cima).
3. Escolha **Adicionar à Tela de Início**.

**Android (Chrome)**
1. Abra o endereço acima no Chrome.
2. Toque em **Instalar app** na tela de instalação, ou no menu ⋮ → **Instalar app**.

Depois de instalado, o app abre em tela cheia e funciona offline. Em Perfil → App no celular, **Baixar fotos do treino** guarda as fotos dos exercícios para ver sem internet.

### Diferenças entre os sistemas

| Recurso | iPhone | Android |
|---|---|---|
| Instalação | Manual, pelo menu Compartilhar | Botão Instalar app |
| Vibração no fim do descanso | Não (o iOS não permite) | Sim |
| Bipe no fim do descanso | Sim, com o app aberto | Sim, com o app aberto |
| Tela ligada durante o treino | Sim (iOS 16.4 ou mais novo) | Sim |
| Backup | Folha de compartilhar (Arquivos, iCloud, WhatsApp) | Folha de compartilhar (Drive, WhatsApp) |

Nos dois sistemas o timer continua certo se a tela apagar: ao voltar, ele mostra o tempo que falta de verdade. O aviso sonoro só toca com o app aberto.

## Desenvolvimento

```bash
npm install
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run build:exercises
```

```bash
npm run icons
```

`build:exercises` monta o banco de exercícios a partir de `data/curadoria.txt`. `icons` gera os PNGs a partir de `public/icon.svg`.

Cada push na `main` publica o app no GitHub Pages pelo workflow `.github/workflows/deploy.yml`.

Dados de exercícios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público).
