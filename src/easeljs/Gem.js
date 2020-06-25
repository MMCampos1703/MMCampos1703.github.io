
/// O item que o jogador deve coletar.

(function (window) {
    var localBounds;
    
    // Controle da animação de subir e descer da maçã
    var BounceHeight = 0.18;
    var BounceRate = 3.0;
    var BounceSync = -0.75;

    function Gem(texture, level, position) {
        this.initialize(texture, level, position);
    }
    Gem.prototype = new Bitmap();

    // Construtor unico para evitar substituir a classe base
    Gem.prototype.Bitmap_initialize = Gem.prototype.initialize;

    Gem.prototype.initialize = function (texture, level, position) {
        var width;
        var left;
        var height;
        var top;
        var frameWidth;
        var frameHeight;

        this.Bitmap_initialize(texture);
        this.level = level;

        this.x = position.x * 40;
        this.y = position.y * 32;
        
        if (enableShadows)
            this.shadow = new Shadow("#000", 3, 2, 2);
        
        // A maçã é animada a partir de uma posição base no eixo Y
        this.basePosition = new Point(this.x, this.y);

        frameWidth = texture.width;
        frameHeight = texture.height;

        width = frameWidth * 0.8;
        left = frameWidth / 2;
        height = frameWidth * 0.8;
        top = frameHeight - height;
        localBounds = new XNARectangle(left, top, width, height);
    };

    Gem.prototype.PointValue = 30;

    /// Balança pra cima e pra baixo :)
    Gem.prototype.BoundingRectangle = function () {
        var left = Math.round(this.x) + localBounds.x;
        var top = Math.round(this.y) + localBounds.y;

        return new XNARectangle(left, top, localBounds.width, localBounds.height);
    };

    Gem.prototype.tick = function () {
        var t = (Ticker.getTime() / 1000) * BounceRate + this.x * BounceSync;
        var bounce = Math.sin(t) * BounceHeight * 32;
        this.y = this.basePosition.y + bounce;
    };

    window.Gem = Gem;
} (window));