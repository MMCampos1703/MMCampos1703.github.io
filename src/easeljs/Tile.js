

//Controla a detecção de colisões e os comportamentos de um bloco
function Enum() { }

// Um bloco Passable é aquele que não impede o movimento do jogador
// Passable = 0,

// Um bloco Impassable é completamente sólido, o jogador não consegue passar através dele.
//  Impassable = 1,

// Um bloco Platform é aquele que o jogador consegue passar através por todas direções exceto por cima.
// O topo é sólido e se comporta como um bloco normal. O jogador pode pular de baixo pra cima e passar de
// um lado para o outro, mas não consegue cair de cima pra baixo.
// Platform = 2

Enum.TileCollision = { Passable: 0, Impassable: 1, Platform: 2 };

(function (window) {
    function Tile(texture, collision, x, y) {
        this.initialize(texture, collision,x,y);
    }
    Tile.prototype = new Bitmap();
    
      // construtor
    Tile.prototype.Bitmap_initialize = Tile.prototype.initialize; // distinto para evitar sobrescrever a classe base

    Tile.prototype.initialize = function(texture, collision, x, y) {
        if (texture != null) {
            this.Bitmap_initialize(texture);
            this.empty = false;
        }
        else {
            this.empty = true;
        }
        this.Collision = collision;
        this.x = x * this.Width;
        this.y = y * this.Height;
    };

    Tile.prototype.Width = 40;
    Tile.prototype.Height = 32;

    window.Tile = Tile;
} (window));