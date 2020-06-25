//-----------------------------------------------------------------------------
// Level.js
//
// Inspired by the Microsoft XNA Community Game Platformer Sample
// Copyright (C) Microsoft Corporation. All rights reserved.
// Ported to HTML5 Canvas with EaselJS by David Rousset - http://blogs.msdn.com/davrous
//-----------------------------------------------------------------------------

// A fase é um grid de blocos uniforme com os intens e inimigos
// A fase controla o player, as condições de vitória e o placar
(function(window) {
    // Mostrar o contador de FPS
    var fpsLabel;

    // Construir o plano de fundo com 3 camadas distintas
    var backgroundSeqTile1, backgroundSeqTile2, backgroundSeqTile3;

    var PointsPerSecond = 5;

    var globalTargetFPS = 17;

    var audioGemIndex = 0;

    var StaticTile = new Tile(null, Enum.TileCollision.Passable, 0, 0);

    function Level(stage, contentManager, textLevel, gameWidth, gameHeight) {
        this.levelContentManager = contentManager;
        this.levelStage = stage;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        // Entidades na fase
        this.Hero = null;
        this.Gems = [];
        this.Enemies = [];
        // Elementos principais da fase  
        this.Start = null;
        this.Exit = new Point(-1, -1);
        this.Score = 0;
        this.ReachedExit = false;
        this.IsHeroDied = false;
        // O tempo em segundos que você tem para completar a fase
        this.TimeRemaining = 120;
        // Salvar o tempo de quando iniciou a fase
        this.InitialGameTime = Ticker.getTime();
        // Criação do fundo com 3 camadas baseadas em 3 variações
        this.CreateAndAddRandomBackground();
        // Construir a matriz de caracteres que constitui a fase
        this.textTiles = Array.matrix(15, 20, "|");
        // Objetos físicos da fase
        this.tiles = Array.matrix(15, 20, "|");
        this.LoadTiles(textLevel);
    };

    // Descarregar o conteúdo da fase
    Level.prototype.Dispose = function() {
        this.levelStage.removeAllChildren();
        this.levelStage.update();
        try {
            this.levelContentManager.globalMusic.pause();
        } catch (err) {}
    };

    // Transformar uma unica linha de caracteres em um array
    Level.prototype.ParseLevelLines = function(levelLine) {
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 20; j++) {
                this.textTiles[i][j] = levelLine.charAt((i * 20) + j);
            }
        }
    };

    // Cria cada bloco da fase e carrega seu comportamento e aparência.
    // Também valida se o arquivo da fase está correto, com inicio, fim, etc.
    // <param name="fileStream">
    // A string que contém os dados de bloco.
    Level.prototype.LoadTiles = function(fileStream) {
        this.ParseLevelLines(fileStream);

        // Loop para cada posição,
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 20; j++) {
                this.tiles[i][j] = this.LoadTile(this.textTiles[i][j], j, i);
            }
        }

        // Verifica se o nivel tem inicio e fim.
        if (this.Hero == null) {
            throw "A fase precisa de um ponto inicial (1).";
        }
        if (this.Exit.x === -1 && this.Exit.y === -1) {
            throw "A fase precisa de uma saída (X).";
        }
    };

    /// Carrega a aparencia e comportamento de um bloco individual
    /// <param name="tileType"> O caractere que india o que carregar
    /// <param name="x"> A localização no eixo x
    /// <param name="y"> A localização no eixo y
    /// <returns>O bloco carregado.</returns>
    Level.prototype.LoadTile = function(tileType, x, y) {
        switch (tileType) {
            // Area vazia                                                                                                                     
            case '.':
                return new Tile(null, Enum.TileCollision.Passable, x, y);
                break;

                // Saída                                                                                      
            case 'X':
                return this.LoadExitTile(x, y);
                break;

                // Maçã                                                                                      
            case 'G':
                return this.LoadGemTile(x, y);
                break;

                // Bloco Flutuante                                                                                     
            case '-':
                return this.LoadNamedTile("Platform", Enum.TileCollision.Platform, x, y);
                break;

                // Inimigos                                                                                     
            case 'A':
                return this.LoadEnemyTile(x, y, "MonsterA");
                break;

            case 'B':
                return this.LoadEnemyTile(x, y, "MonsterB");
                break;

                // Bloco plataforma                                                                                      
            case '~':
                return this.LoadVarietyTile("BlockB", 2, Enum.TileCollision.Platform, x, y);
                break;

                // Bloco passável                                                                                      
            case ':':
                return this.LoadVarietyTile("BlockB", 2, Enum.TileCollision.Passable, x, y);
                break;

                // Inicio da fase                                                                                      
            case '1':
                return this.LoadStartTile(x, y);
                break;

                // Bloco sólido                                                                                      
            case '#':
                return this.LoadVarietyTile("BlockA", 7, Enum.TileCollision.Impassable, x, y);
                break;

        }
    };

    /// <summary>
    /// Cria novo bloco. Os outros metodos de carregar bloco vem depois deste depois
    /// de concluir sua logica.
    /// <param name="collision"> o tipo de colisão do bloco
    /// <returns>O novo bloco</returns>
    Level.prototype.LoadNamedTile = function(name, collision, x, y) {
        switch (name) {
            case "Platform":
                return new Tile(this.levelContentManager.imgPlatform, collision, x, y);
                break;

            case "Exit":
                return new Tile(this.levelContentManager.imgExit, collision, x, y);
                break;

            case "BlockA0":
                return new Tile(this.levelContentManager.imgBlockA0, collision, x, y);
                break;

            case "BlockA1":
                return new Tile(this.levelContentManager.imgBlockA1, collision, x, y);
                break;

            case "BlockA2":
                return new Tile(this.levelContentManager.imgBlockA2, collision, x, y);
                break;

            case "BlockA3":
                return new Tile(this.levelContentManager.imgBlockA3, collision, x, y);
                break;

            case "BlockA4":
                return new Tile(this.levelContentManager.imgBlockA4, collision, x, y);
                break;

            case "BlockA5":
                return new Tile(this.levelContentManager.imgBlockA5, collision, x, y);
                break;

            case "BlockA6":
                return new Tile(this.levelContentManager.imgBlockA6, collision, x, y);
                break;

            case "BlockB0":
                return new Tile(this.levelContentManager.imgBlockB0, collision, x, y);
                break;

            case "BlockB1":
                return new Tile(this.levelContentManager.imgBlockB1, collision, x, y);
                break;
        }
    };

    /// Carrega um bloco com aparência aleatória.
    /// <param name="baseName"> o nome de arquivo do grupo de blocos. fica tipo assim:
    /// bloco0.png, bloco1.png, bloco2.png
    /// <param name="variationCount"> O numero de variações nesse grupo.
    Level.prototype.LoadVarietyTile = function(baseName, variationCount, collision, x, y) {
        var index = Math.floor(Math.random() * (variationCount - 1));
        return this.LoadNamedTile(baseName + index, collision, x, y);
    };

    /// Instancia o jogador, o coloca na fase, e se lembra de onde coloca-lo caso morra
    Level.prototype.LoadStartTile = function(x, y) {
        if (this.Hero != null) {
            throw "A level may only have one starting point.";
        }

        this.Start = this.GetBounds(x, y).GetBottomCenter();
        this.Hero = new Player(this.levelContentManager.imgPlayer, this, this.Start);

        return new Tile(null, Enum.TileCollision.Passable, x, y);
    };

    /// Grava a localização da saída da fase
    Level.prototype.LoadExitTile = function(x, y) {
        if (this.Exit.x !== -1 & this.Exit.y !== y) {
            throw "A level may only have one exit.";
        }

        this.Exit = this.GetBounds(x, y).Center;

        return this.LoadNamedTile("Exit", Enum.TileCollision.Passable, x, y);
    };

    /// Instancia uma macã e a coloca na fase
    Level.prototype.LoadGemTile = function(x, y) {
        position = this.GetBounds(x, y).Center;
        var position = new Point(x, y);
        this.Gems.push(new Gem(this.levelContentManager.imgGem, this, position));

        return new Tile(null, Enum.TileCollision.Passable, x, y);
    };

    /// Instancia um inimigo e o coloca na fase
    Level.prototype.LoadEnemyTile = function(x, y, name) {
        var position = this.GetBounds(x, y).GetBottomCenter();
        switch (name) {
            case "MonsterA":
                this.Enemies.push(new Enemy(this, position, this.levelContentManager.imgMonsterA));
                break;
            case "MonsterB":
                this.Enemies.push(new Enemy(this, position, this.levelContentManager.imgMonsterB));
                break;
            case "MonsterC":
                this.Enemies.push(new Enemy(this, position, this.levelContentManager.imgMonsterC));
                break;
            case "MonsterD":
                this.Enemies.push(new Enemy(this, position, this.levelContentManager.imgMonsterD));
                break;
        }

        return new Tile(null, Enum.TileCollision.Passable, x, y);
    };

    /// Gets the bounding rectangle of a tile in world space.
    Level.prototype.GetBounds = function(x, y) {
        return new XNARectangle(x * StaticTile.Width, y * StaticTile.Height, StaticTile.Width, StaticTile.Height);
    };

    /// Largura da fase em blocos
    Level.prototype.Width = function() {
        return 20;
    };

    /// Altura da fase em blocos
    Level.prototype.Height = function() {
        return 15;
    };

    /// Pega o modo de colisão do bloco. Impede de "sair" pelos lados, mas deixa pular além do limite superior
    /// e cair em buracos
    Level.prototype.GetCollision = function(x, y) {
        // Impede que o jogador saia quando a fase termina
        if (x < 0 || x >= this.Width()) {
            return Enum.TileCollision.Impassable;
        }
        // Permite pular no topo e cair em buracos
        if (y < 0 || y >= this.Height()) {
            return Enum.TileCollision.Passable;
        }

        return this.tiles[y][x].Collision;
    };

    // Cria fundo randomico baseado em 3 layers
    Level.prototype.CreateAndAddRandomBackground = function() {
        // Numero aleatório de 0 a 6
        var randomnumber = Math.floor(Math.random() * 6);

        backgroundSeqTile1 = new Bitmap(this.levelContentManager.imgBackgroundLayers[0][randomnumber]);
        backgroundSeqTile2 = new Bitmap(this.levelContentManager.imgBackgroundLayers[1][randomnumber]);

        this.levelStage.addChild(backgroundSeqTile1);
        this.levelStage.addChild(backgroundSeqTile2);
    };

    // Metodo que é chamado pra carregar a fase quando tudo carregou
    Level.prototype.StartLevel = function() {
        // Colocar todos blocos na plataforma EaselJS
        // Plataforma que os personagens andam sobre
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 20; j++) {
                if (!!this.tiles[i][j] && !this.tiles[i][j].empty) {
                    this.levelStage.addChild(this.tiles[i][j]);
                }
            }
        }

        // Adicionar as maçãs
        for (var i = 0; i < this.Gems.length; i++) {
            this.levelStage.addChild(this.Gems[i]);
        }

        // Adicionar os inimigos
        for (var i = 0; i < this.Enemies.length; i++) {
            this.levelStage.addChild(this.Enemies[i]);
        }

        // Adicionar o galo
        this.levelStage.addChild(this.Hero);
        // Tocar a musica de fundo
        this.levelContentManager.globalMusic.play();
        this.levelContentManager.globalMusic.loop = true;
        // Contador de FPS
        fpsLabel = new Text("-- fps", "bold 14px Arial", "#000");
        this.levelStage.addChild(fpsLabel);
        fpsLabel.x = this.gameWidth - 50;
        fpsLabel.y = 20;
    };

    /// Atualiza todos objetos, faz suas colisões e trata do tempo e placar
    Level.prototype.Update = function() {
        var ElapsedGameTime = (Ticker.getTime() - this.InitialGameTime) / 1000;

        this.Hero.tick();

        if (!this.Hero.IsAlive || this.TimeRemaining === 0) {
            this.Hero.ApplyPhysics();
        } else if (this.ReachedExit) {
            var seconds = parseInt((globalTargetFPS / 1000) * 200);
            seconds = Math.min(seconds, parseInt(Math.ceil(this.TimeRemaining)));
            this.TimeRemaining -= seconds;
            this.Score += seconds * PointsPerSecond;
        } else {
            this.TimeRemaining = 120 - ElapsedGameTime;

            if (!this.IsHeroDied)
                this.UpdateGems();

            if (this.Hero.BoundingRectangle().Top() >= this.Height() * StaticTile.Height) {
                this.OnPlayerKilled();
            }

            this.UpdateEnemies();

            // o player alcança a saida quando está no chão e o seu retangulo de colisão
            // contém o centro do bloco da saída.
            // Só pode sair se tiver coletado todas maçãs
            if (this.Hero.IsAlive &&
                this.Gems.length < 1 &&
                this.Hero.IsOnGround &&
                this.Hero.BoundingRectangle().ContainsPoint(this.Exit)) {
                this.OnExitReached();
            }
        }

        // Travar o tempo no 0
        if (this.TimeRemaining < 0)
            this.TimeRemaining = 0;

        fpsLabel.text = Math.round(Ticker.getMeasuredFPS()) + " fps";

        this.levelStage.update();
    };

    /// Faz a animação de cada maçã e permite que o jogador as colete
    Level.prototype.UpdateGems = function() {
        for (var i = 0; i < this.Gems.length; i++) {
            this.Gems[i].tick();
            if (this.Gems[i].BoundingRectangle().Intersects(this.Hero.BoundingRectangle())) {
                // Remove a maçã da tela
                this.levelStage.removeChild(this.Gems[i]);
                this.Score += this.Gems[i].PointValue;
                // Remove a maçã da memória
                this.Gems.splice(i, 1);
                // Toca o efeito sonoro
                this.levelContentManager.gemCollected[audioGemIndex % 8].play();
                audioGemIndex++;
            }
        }
    };

    /// Anima cada inimigo e os permite matar o jogador
    Level.prototype.UpdateEnemies = function() {
        for (var i = 0; i < this.Enemies.length; i++) {
            if (this.Hero.IsAlive && this.Enemies[i].BoundingRectangle().Intersects(this.Hero.BoundingRectangle())) {
                this.OnPlayerKilled(this.Enemies[i]);
                // Re-escaneia o array dos inimigos para atualiza-los com a informação que o jogador morreu
                i = 0;
            }
            this.Enemies[i].tick();
        }
    };

    /// Quando o jogador morre
    /// <param name="killedBy"> o inimigo que matou o jogador. Nulo quando este cai em um buraco.
    Level.prototype.OnPlayerKilled = function(killedBy) {
        this.IsHeroDied = true;
        this.Hero.OnKilled(killedBy);
    };

    /// Chamado quando o jogador chega no fim da fase
    Level.prototype.OnExitReached = function() {
        this.Hero.OnReachedExit();
        this.ReachedExit = true;
    };

    Level.prototype.StartNewLife = function() {
        this.Hero.Reset(this.Start);
    };

    window.Level = Level;
}(window));