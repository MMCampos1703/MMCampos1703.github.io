(function(window) {
    // keycodes de cada tecla
    var TECLA_ESPACO = 32;
    var TECLA_CIMA = 38;
    var TECLA_ESQUERDA = 37;
    var TECLA_DIREITA = 39;
    var TECLA_W = 87;
    var TECLA_A = 65;
    var TECLA_D = 68;

    // Numero de fases na pasta de fases. Assume-se que começa com uma fase 0
    var numberOfLevels = 11;

    // Fase que é carregada caso algum erro cabuloso ocorra.
    var hardcodedErrorTextLevel = ".....................................................................................................................................................GGG.................###................................GGG.......GGG.......###...--..###........................1................X.####################";

    // Variaves que cuidam do overlay( as mensagens de "vc morreu!", "vc ganhou!" )
    var statusCanvas = null;
    var statusCanvasCtx = null;
    var overlayEnabled = true;
    var scoreText = null;
    var timeRemainingText = null;

    // O temporizador fica vermelho quando abaixo de 30 segundos
    var WarningTime = 30;

    function PlatformerGame(stage, contentManager, gameWidth, gameHeight) {
        this.platformerGameStage = stage;
        this.platformerGameContentManager = contentManager;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.levelIndex = -1;
        this.level = null;
        this.wasContinuePressed = false;
        this.continuePressed = false;
        // Prepara o overlay para futuros usos
        this.SetOverlayCanvas();

        var instance = this; // Guarda o contexto atual

        document.onkeydown = function(e) {
            instance.handleKeyDown(e);
        };

        document.onkeyup = function(e) {
            instance.handleKeyUp(e);
        };

        this.LoadNextLevel();
    };

    // logica Update do easel
    PlatformerGame.prototype.tick = function() {
        try {
            if (this.level !== null) {
                this.HandleInput();
                this.level.Update();
                this.UpdateScore();

                // Mostrar o overlay certo caso tenha morrido ou ganhado
                if (overlayEnabled) {
                    this.DrawOverlay();
                }
            }
        } catch (e) {
            console.log('Error', e);
        }
    };

    // Iniciar o jogo
    PlatformerGame.prototype.StartGame = function() {
        Ticker.addListener(this);
        Ticker.useRAF = enableRAF;
        Ticker.setFPS(60);
    };

    // Pontuação do jogador
    PlatformerGame.prototype.UpdateScore = function() {
        if (scoreText === null) {
            timeRemainingText = new Text("TIME: ", "bold 14px Arial", "yellow");
            timeRemainingText.x = 10;
            timeRemainingText.y = 20;
            this.platformerGameStage.addChild(timeRemainingText);

            scoreText = new Text("SCORE: 0", "bold 14px Arial", "yellow");
            scoreText.x = 10;
            scoreText.y = 34;
            this.platformerGameStage.addChild(scoreText);
        }

        if (this.level.TimeRemaining < WarningTime && !this.level.ReachedExit) {
            timeRemainingText.color = "red";
        } else {
            timeRemainingText.color = "yellow";
        }

        scoreText.text = "SCORE: " + this.level.Score;
        timeRemainingText.text = "TIME: " + parseInt(this.level.TimeRemaining);
    };

    PlatformerGame.prototype.HandleInput = function() {
        if (!this.wasContinuePressed && this.continuePressed) {
            if (!this.level.Hero.IsAlive) {
                this.HideStatusCanvas();
                this.level.StartNewLife();
            } else if (this.level.TimeRemaining == 0) {
                if (this.level.ReachedExit)
                    this.LoadNextLevel();
                else
                    this.ReloadCurrentLevel();
            }
        }

        this.wasContinuePressed = this.continuePressed;
    };

    // Determina o overlay a ser mostrado
    PlatformerGame.prototype.DrawOverlay = function() {
        var status = null;

        if (this.level.TimeRemaining == 0) {
            if (this.level.ReachedExit) {
                status = this.platformerGameContentManager.winOverlay;
            } else {
                status = this.platformerGameContentManager.loseOverlay;
            }
        } else if (!this.level.Hero.IsAlive) {
            status = this.platformerGameContentManager.diedOverlay;
        }

        if (status !== null) {
            this.ShowStatusCanvas(status);
        }
    };

    // Cria um segundo canvas que mostra os overlays com opacidade
    PlatformerGame.prototype.SetOverlayCanvas = function() {
        var oneOfThisOverlay = this.platformerGameContentManager.winOverlay;

        statusCanvas = document.createElement("canvas");
        document.body.appendChild(statusCanvas);
        statusCanvasCtx = statusCanvas.getContext("2d");

        statusCanvas.setAttribute('width', oneOfThisOverlay.width);
        statusCanvas.setAttribute('height', oneOfThisOverlay.height);
        // We center it
        var statusX = (this.gameWidth - oneOfThisOverlay.width) / 2;
        var statusY = (this.gameHeight - oneOfThisOverlay.height) / 2;
        statusCanvas.style.position = 'absolute';
        statusCanvas.style.top = statusY + "px";
        statusCanvas.style.left = statusX + "px";
    };

    // Limpa o canvas de overlay anterior e prepara para a nova img
    PlatformerGame.prototype.ShowStatusCanvas = function(status) {
        statusCanvas.style.display = "block";
        statusCanvasCtx.clearRect(0, 0, status.width, status.height);
        statusCanvasCtx.drawImage(status, 0, 0);
        overlayEnabled = false;
    };

    // Esconde o canvas de overlay durante a jogatina
    PlatformerGame.prototype.HideStatusCanvas = function() {
        overlayEnabled = true;
        statusCanvas.style.display = "none";
    };

    // Carrega a próxima fase da pasta /levels/
    PlatformerGame.prototype.LoadNextLevel = function() {
        this.levelIndex = (this.levelIndex + 1) % numberOfLevels;

        // Procura onde está hospedado
        var nextLevelUrl = window.location.href.replace('index.html', '') + "levels/" + this.levelIndex + ".txt";
        try {
            var request = new XMLHttpRequest();
            request.open('GET', nextLevelUrl, true);

            var instance = this;
            request.onreadystatechange = function() {
                instance.OnLevelReady(this);
            };
            request.send(null);
        } catch (e) {
            // access denied, vai carregar a fase de erro
            this.LoadThisTextLevel(hardcodedErrorTextLevel);
        }
    };

    // Método callback do evento onreadystatechange do XMLHttpRequest
    PlatformerGame.prototype.OnLevelReady = function(eventResult) {
        var newTextLevel = "";

        if (eventResult.readyState == 4) {
            // se tá certo
            if (eventResult.status == 200)
                newTextLevel = eventResult.responseText.replace(/[\n\r\t]/g, '');
            else {
                console.log('Error', eventResult.statusText);
                // Carregar a fase de erro
                newTextLevel = hardcodedErrorTextLevel;
            }

            this.LoadThisTextLevel(newTextLevel);
        }
    };

    PlatformerGame.prototype.LoadThisTextLevel = function(textLevel) {
        this.HideStatusCanvas();
        scoreText = null;

        // Descarregar o conteudo da fase antes de seguir para a proxima
        if (this.level != null)
            this.level.Dispose();

        this.level = new Level(this.platformerGameStage, this.platformerGameContentManager, textLevel, this.gameWidth, this.gameHeight);
        this.level.StartLevel();
    };

    // Quando acaba o tempo
    PlatformerGame.prototype.ReloadCurrentLevel = function() {
        --this.levelIndex;
        this.LoadNextLevel();
    };

    PlatformerGame.prototype.handleKeyDown = function(e) {
        if (!e) { var e = window.event; }
        switch (e.keyCode) {
            case TECLA_A:
                ;
            case TECLA_ESQUERDA:
                this.level.Hero.direction = -1;
                break;
            case TECLA_D:
                ;
            case TECLA_DIREITA:
                this.level.Hero.direction = 1;
                break;
            case TECLA_W:
                this.level.Hero.isJumping = true;
                this.continuePressed = true;
            case TECLA_CIMA:
                this.level.Hero.isJumping = true;
                this.continuePressed = true;
            case TECLA_ESPACO:
                this.level.Hero.isJumping = true;
                this.continuePressed = true;
        }
    };

    PlatformerGame.prototype.handleKeyUp = function(e) {
        if (!e) { var e = window.event; }
        switch (e.keyCode) {
            case TECLA_A:
                ;
            case TECLA_ESQUERDA:
                ;
            case TECLA_D:
                ;
            case TECLA_DIREITA:
                this.level.Hero.direction = 0;
                break;
            case TECLA_W:
                this.continuePressed = false;
                break;
            case TECLA_CIMA:
                this.continuePressed = false;
                break;
            case TECLA_ESPACO:
                this.continuePressed = false;
                break;
        }
    };

    window.PlatformerGame = PlatformerGame;
}(window));