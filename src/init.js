/**
 * Calcula una nueva orientación basada en la velocidad.
 * @param {number} current - Orientación actual en radianes.
 * @param {Vector} velocity - Vector de velocidad.
 * @returns {number} - Nueva orientación en radianes.
 */
function newOrientation(current, velocity) {
    if (velocity.length() > 0) {
        // Calcula el ángulo usando atan2. En Phaser, y aumenta hacia abajo.
        return Math.atan2(velocity.y, velocity.x);
    } else {
        // Mantiene la orientación actual si no hay movimiento.
        return current;
    }
}

class Vector {
    constructor(x = 0, y = 0) { // Cambiado de z a y
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    scale(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector(0, 0);
        return new Vector(this.x / len, this.y / len);
    }

    angle() {
        return Math.atan2(this.y, this.x); // Ángulo en radianes
    }

    invertX() {
        return new Vector(-this.x, this.y);
    }

    invertY() {
        return new Vector(this.x, -this.y);
    }
}

class SteeringOutput {
    constructor(linear = new Vector(), angular = 0) {
        this.linear = linear;
        this.angular = angular;
    }
}

class KinematicSteeringOutput {
    constructor(velocity = new Vector(), rotation = 0) {
        this.velocity = velocity;
        this.rotation = rotation;
    }
}


class Staticc{
    constructor(position = new Vector(), orientation){
        this.position = position;
        this.orientation = orientation;
    }
}

class Anothercharacter{
    constructor(position = new Vector(), orientation, velocity = new Vector()){
        this.position = position;
        this.orientation = orientation;
        this.velocity =velocity
    }
}




// class Kinematic {
//     constructor(staticc= new Staticc(), velocity, rotation) {
//         this.position = staticc.position;
//         this.orientation = staticc.orientation; // en radianes
//         this.velocity = velocity;
//         this.rotation = rotation;
//     }

//     update(steering, time) {
//         // Actualizar posición
//         this.position = this.position.add(this.velocity.scale(time));
//      //   this.orientation += this.rotation * time;
//         // Actualizar orientación usando la función newOrientation
//      //   this.orientation = newOrientation(this.orientation, this.velocity);
//         this.orientation += this.rotation * time;
    

//         // Verificar que steering no sea null y actualizar la velocidad y rotación basados en steering
//         if (steering && steering.velocity) {
//             this.velocity = steering.velocity;
//         }

//         if (steering && steering.angular !== undefined) {
//             this.rotation += steering.angular * time;
//             // Actualizar la orientación basada en la rotación
//           // this.orientation += this.rotation * time;
//         }
//     }
// }


class Kinematic {
    constructor(staticc= new Staticc(), velocity, rotation) {
        this.position = staticc.position;
        this.orientation = staticc.orientation; // en radianes
        this.velocity = velocity;
        this.rotation = rotation;
    }

    update(steering, time) {
        // Actualizar posición
        this.position = this.position.add(this.velocity.scale(time));
        
        this.orientation += this.rotation * time;
        
        // Verificar que steering no sea null y actualizar la velocidad y rotación basados en steering
        if (steering && steering.linear !== undefined) 
            this.velocity = this.velocity.add(steering.linear.scale(time));

        if (steering && steering.velocity) {
             this.velocity = steering.velocity;
         }

        
        if (steering && steering.angular !== undefined) 
            this.rotation += steering.angular * time;

        
    }
}


class KinematicForWander {
    constructor(staticc= new Staticc(), velocity, rotation) {
        this.position = staticc.position;
        this.orientation = staticc.orientation; // en radianes
        this.velocity = velocity;
        this.rotation = rotation;
    }

    update(steering, time) {
        // Actualizar posición
          // Actualizar posición
          this.position = this.position.add(this.velocity.scale(time));
        
          this.orientation += this.rotation * time;
          
          // Verificar que steering no sea null y actualizar la velocidad y rotación basados en steering
          if (steering && steering.linear !== undefined) 
              this.velocity = this.velocity.add(steering.linear.scale(time));
  
        //   if (steering && steering.velocity) {
        //        this.velocity = steering.velocity;
        //    }
            this.velocity = this.velocity.add(this.velocity.scale(time));
  


          
          if (steering && steering.angular !== undefined) 
              this.rotation += steering.angular * time;

        
    }
}


class KinematicSteeringBehaviors {
    constructor(staticc= new Staticc(), velocity, rotation) {
        this.position = staticc.position;
        this.orientation = staticc.orientation; // en radianes
        this.velocity = velocity;
        this.rotation = rotation;
    }

    update(steering, time, maxSpeed) {
        // Actualizar posición
        this.position = this.position.add(this.velocity.scale(time));
        
        this.orientation += this.rotation * time;
        
        // Verificar que steering no sea null y actualizar la velocidad y rotación basados en steering
        if (steering && steering.linear !== undefined) 
            this.velocity = this.velocity.add(steering.linear.scale(time));
        
       // if (steering && steering.velocity !== undefined) 
      //      this.velocity = steering.velocity
        
        
        if (steering && steering.angular !== undefined) 
            this.rotation += steering.angular * time;
        
   //     if (steering && steering.rotation !== undefined) 
    //        this.rotation += steering.rotation * time;

        if(this.velocity.length()> maxSpeed){
            this.velocity = this.velocity.normalize()
            this.velocity = this.velocity.scale(maxSpeed);
        }
        
    }
}



class KinematicArrive {
    constructor(character, target, maxSpeed, radius, timeToTarget = 0.75) {
        this.character = character;
        this.target = target;
        this.maxSpeed = maxSpeed; // Velocidad máxima
        this.radius = radius; // Rango interior (Radio de satisfacción)
        this.timeToTarget = timeToTarget; // Tiempo de llegada
    }

    getSteering() {
        const result = new KinematicSteeringOutput();

        // Obtener la dirección hacia el objetivo
        result.velocity = this.target.position.subtract(this.character.position);

        const distance = result.velocity.length(); // Obtener la distancia al objetivo

        // Si estamos dentro del radio interior, el personaje se detiene
        if (distance < this.radius) {
            return null; // No hacer nada, detener el movimiento
        }

        // Ajustar la velocidad para que el personaje llegue en timeToTarget segundos
        result.velocity = result.velocity.scale(1 / this.timeToTarget);

        // Si la velocidad es mayor que la velocidad máxima, normalizar
        if (result.velocity.length() > this.maxSpeed) {
            result.velocity = result.velocity.normalize().scale(this.maxSpeed);
        }

        // Orientación hacia la dirección de movimiento usando newOrientation
        this.character.orientation = newOrientation(this.character.orientation, result.velocity);

        result.rotation = 0;
        return result;
    }
}


class KinematicFlee {
    constructor(character, target, maxSpeed, radius, timeToTarget = 0.75) {
        this.character = character;
        this.target = target;
        this.maxSpeed = maxSpeed; // Velocidad máxima
        this.radius = radius; // Rango interior (Radio de satisfacción)
        this.timeToTarget = timeToTarget; // Tiempo de llegada
    }

    getSteering() {
        const result = new KinematicSteeringOutput();

        // Obtener la dirección hacia el objetivo
        result.velocity =this.character.position.subtract(this.target.position);

        const distance = result.velocity.length(); // Obtener la distancia al objetivo

        // Si estamos dentro del radio interior, el personaje se detiene
        if (distance > this.radius) {
            result.velocity = new Vector(0,0);
            return result; // No hacer nada, detener el movimiento
        }

        // Ajustar la velocidad para que el personaje llegue en timeToTarget segundos
        result.velocity = result.velocity.scale(1 / this.timeToTarget);

        // Si la velocidad es mayor que la velocidad máxima, normalizar
        if (result.velocity.length() > this.maxSpeed) {
            result.velocity = result.velocity.normalize().scale(this.maxSpeed);
        }

        // Orientación hacia la dirección de movimiento usando newOrientation
        this.character.orientation = newOrientation(this.character.orientation, result.velocity);

        result.rotation = 0;
        return result;
    }
}




class KinematicWander {
    constructor(character, maxSpeed, maxRotation) {
        this.character = character;
        this.maxSpeed = maxSpeed;
        this.maxRotation = maxRotation;
    }

    getSteering() {
        const result = new KinematicSteeringOutput();

        // Convertir la orientación actual en un vector de velocidad usando seno y coseno
        var asvector =  this.asVector();
        result.velocity = asvector.scale(this.maxSpeed);
        // Cambiar la orientación aleatoriamente
        var random = this.randomBinomial();
        result.rotation = random * this.maxRotation;

       //this.character.orientation = newOrientation(this.character.orientation, result.velocity);

        return result;
    }

    // Función que genera un valor aleatorio entre -1 y 1
    randomBinomial() {
        return Math.random() - Math.random();
    }

    asVector() {
        return new Vector(Math.sin(this.character.orientation), Math.cos(this.character.orientation)).normalize();
    }

}



class Seek{
    constructor(character,target,maxAcceleration){
        this.character = character // Kinematic
        this.target = target // Kinematic
        this.maxAcceleration= maxAcceleration


    }

    getSteering(){
        var result = new SteeringOutput();

        result.linear = this.target.position.subtract(this.character.position)

        result.linear = result.linear.normalize();

        result.linear = result.linear.scale(this.maxAcceleration);

        this.character.orientation = newOrientation(this.character.orientation, this.character.velocity);

        result.angular = 0;

        return result
    }


    
}


class Arrive{
    constructor(character,target,maxAcceleration, maxSpeed, targetRadius,slowRadius, timeToTarget = 0.1){
        this.character = character // Kinematic
        this.target = target // Kinematic
        this.maxAcceleration= maxAcceleration
        this.maxSpeed = maxSpeed
        this.targetRadius = targetRadius
        this.slowRadius = slowRadius
        this.timeToTarget =timeToTarget
    }

    getSteering(){
        var result = new SteeringOutput();
        var targetSpeed; 
        var direccion = this.target.position.subtract(this.character.position)

        var distance = direccion.length() 


        if(distance < this.targetRadius)
            return null;

        if(distance > this.slowRadius)
            targetSpeed = this.maxSpeed;
        else
            targetSpeed = (this.maxSpeed * distance)/this.slowRadius

        
        var targetVelocity = direccion;
        targetVelocity = targetVelocity.normalize();
        targetVelocity = targetVelocity.scale(targetSpeed);

        result.linear = targetVelocity.subtract(this.character.velocity);
        result.linear = result.linear.scale(1/this.timeToTarget);

       if (result.linear.length()>this.maxAcceleration){
            result.linear = result.linear.normalize()
            result.linear = result.linear.scale(this.maxAcceleration);
       }

       this.character.orientation = newOrientation(this.character.orientation, this.character.velocity);

        result.angular = 0;

        return result
    }
}


class Aling{
    constructor(character,target,maxAngularAcceleration, maxRotation, targetRadius,slowRadius, timeToTarget = 0.1){
        this.character = character // Kinematic
        this.target = target // Kinematic
        this.maxAngularAcceleration= maxAngularAcceleration
        this.maxRotation = maxRotation
        this.targetRadius = targetRadius
        this.slowRadius = slowRadius
        this.timeToTarget =timeToTarget
    }

    getSteering(){
        var result = new SteeringOutput();
        var targetRotation;
        var rotation = this.target.orientation - this.character.orientation;

        rotation = this.mapToRange(rotation);

        var rotationSize = Math.abs(rotation);


        if (rotationSize < this.targetRadius)
            return null;

        if(rotationSize> this.slowRadius)
            targetRotation = this.maxRotation;
        else
            targetRotation = (this.maxRotation*rotationSize)/this.slowRadius;

        targetRotation = targetRotation * (rotation /rotationSize);

        result.angular = targetRotation - this.character.rotation
        result.angular = result.angular / this.timeToTarget;

        var angularAcceleration = Math.abs(result.angular);

        if(angularAcceleration > this.maxAngularAcceleration){
            result.angular = result.angular / angularAcceleration
            result.angular = result.angular * this.maxAngularAcceleration
        }

        result.linear= new Vector(0,0);

        return result
    }

    mapToRange(angle){
        return (angle + Math.PI) % ( 2* Math.PI) - Math.PI;
    }

}


class VelocityMatch{
    constructor(character, target,maxAcceleration, timeToTarget=0.1){
        this.character = character
        this.target = target
        this.maxAcceleration = maxAcceleration
        this.timeToTarget = timeToTarget
    }


    getSteering(){
        var result = new SteeringOutput()

        result.linear = this.target.velocity.subtract(this.character.velocity)

        result.linear = result.linear.scale(1/this.timeToTarget);

        if(result.linear.length() > this.maxAcceleration){
            result.linear= result.linear.normalize();
            result.linear = result.linear.scale(this.maxAcceleration)
        }

        result.angular = 0;

        return result
    }
}



class Pursue {
    constructor(character,targetSeek,targetPursue,maxAcceleration,maxPrediction){
        this.character = character
        this.target = targetSeek
        this.maxAcceleration = maxAcceleration
        this.maxPrediction = maxPrediction
        this.targetPursue = targetPursue


    }

    getSteering(){

    
        var prediction;
        var direccion = this.targetPursue.position.subtract(this.character.position);

        var distance = direccion.length();

        var speed = this.character.velocity.length();

        if (speed <= distance /this.maxPrediction){
            prediction = this.maxPrediction
        }else{
            prediction = distance /speed;
        }

         // Validar si explicitTarget es una variable global
         if (typeof explicitTarget !== 'undefined') {
        
            var new_seek = new Seek(this.character, explicitTarget,this.maxAcceleration);

            new_seek.target.position = new_seek.target.position.add(new_seek.target.velocity.scale(prediction));

            return new_seek.getSteering();
        } else {
            throw new Error("explicitTarget no está definido.");
        }


    }


}

document.getElementById('option1').addEventListener('click', () => {
    startPhaserGame('option1');
});

document.getElementById('option2').addEventListener('click', () => {
    startPhaserGame('option2');
});

document.getElementById('option3').addEventListener('click', () => {
    startPhaserGame('option3');
});

document.getElementById('option4').addEventListener('click', () => {
    startPhaserGame('option4');
});
const worldWidth = 1200;
const worldHeight =800;

// Función para teletransportar un objeto si sale de los límites
function wrapAround(kinematic, transportToCenter = false) {
    if (transportToCenter) {
        // Si el kinematic sale de los límites, lo transportamos al centro
        if (kinematic.position.x < 0 || kinematic.position.x > worldWidth ||
            kinematic.position.y < 0 || kinematic.position.y > worldHeight) {
            kinematic.position.x = worldWidth / 2;
            kinematic.position.y = worldHeight / 2;
        }
    } else {
        // Comportamiento de wrap around normal
        if (kinematic.position.x < 0) {
            kinematic.position.x = worldWidth;
        } else if (kinematic.position.x > worldWidth) {
            kinematic.position.x = 0;
        }

        if (kinematic.position.y < 0) {
            kinematic.position.y = worldHeight;
        } else if (kinematic.position.y > worldHeight) {
            kinematic.position.y = 0;
        }
    }
}

var bird1,bird2
var kinematicBird1, kinematicBird2
var kinematicArrive, Kinematicflee,Kinematicwander,seek

function startPhaserGame(option) {
    // Oculta el menú
    document.getElementById('menu').style.display = 'none';

    // Inicia el juego en Phaser
    const config = {
        type: Phaser.AUTO,
        width: 1200,
        height: 800,
        backgroundColor: '#FFFFFF', 
        scene: {
            preload: preloadGame,
            create: createGame,
             update: option === 'option1' ? updateGame1 : option === 'option2' ? updateGame2 : option ==='option3' ? updateGame3 : updateGame4
        }
    };
    const game = new Phaser.Game(config);

    function preloadGame() {
        // Cargar assets según la opción seleccionada
        this.load.image('cielo', './assets/cielo.png');
        this.load.image("bird", "./assets/bird.png");
       


    }

    function createGame() {
      

        // Configurar el evento de teclado
        this.input.keyboard.on('keydown-ESC', returnToMenu);

        // Lógica específica para cada opción
        if (option === 'option1') {

            const background = this.add.image(600, 400, 'cielo').setOrigin(0.5, 0.5);
    
            // Escalar el fondo para que cubra la ventana del juego
            const scaleX = config.width / background.width; // Escala en X
            const scaleY = config.height / background.height; // Escala en Y
            const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
            background.setScale(scale); // Aplica la escala

            bird1  =  this.add.image(50, 50, 'bird').setScale(2);

            bird2  =  this.add.image(1000, 700, 'bird').setScale(1.5);


                // Crear los objetos Kinematic
            var positionBird1=new Staticc( new Vector(bird1.x, bird1.y),0);
            var velocityBird1 = new Vector(300, 0); // Inicialmente moviéndose hacia la derecha
            kinematicBird1 = new Kinematic( positionBird1, velocityBird1, 0);

            var positionBird2=new Staticc( new Vector(bird2.x, bird2.y),0);
            var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
            kinematicBird2 = new Kinematic( positionBird2, velocityBird2, 0);

            kinematicArrive = new KinematicArrive(kinematicBird1,kinematicBird2 ,200,1,0.75);

            cursors = this.input.keyboard.createCursorKeys();


            // Configurar lógica de juego 1
        } else if (option === 'option2') { //KinematicFlee
           
            const background = this.add.image(600, 400, 'cielo').setOrigin(0.5, 0.5);
    
            // Escalar el fondo para que cubra la ventana del juego
            const scaleX = config.width / background.width; // Escala en X
            const scaleY = config.height / background.height; // Escala en Y
            const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
            background.setScale(scale); // Aplica la escala

            bird1  =  this.add.image(150, 150, 'bird').setScale(2);

            bird2  =  this.add.image(1000, 700, 'bird').setScale(1.5);


                // Crear los objetos Kinematic
            var positionBird1=new Staticc( new Vector(bird1.x, bird1.y),0);
            var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
            kinematicBird1 = new Kinematic( positionBird1, velocityBird1, 0);

            var positionBird2=new Staticc( new Vector(bird2.x, bird2.y),0);
            var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
            kinematicBird2 = new Kinematic( positionBird2, velocityBird2, 0);

            Kinematicflee = new KinematicFlee(kinematicBird1,kinematicBird2 ,350,400,0.75);

            cursors = this.input.keyboard.createCursorKeys();







        } else if (option === 'option3') {
            const background = this.add.image(600, 400, 'cielo').setOrigin(0.5, 0.5);
    
            // Escalar el fondo para que cubra la ventana del juego
            const scaleX = config.width / background.width; // Escala en X
            const scaleY = config.height / background.height; // Escala en Y
            const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
            background.setScale(scale); // Aplica la escala

            bird1  =  this.add.image(600, 400, 'bird').setScale(1.5);



                // Crear los objetos Kinematic
            var positionBird1=new Staticc( new Vector(bird1.x, bird1.y),0);
            var velocityBird1 = new Vector(3, 3); // Inicialmente moviéndose hacia la derecha
            kinematicBird1 = new KinematicForWander( positionBird1, velocityBird1, 0.1);

            Kinematicwander = new KinematicWander(kinematicBird1 ,100,0.75);

          
        } else if (option === 'option4') {
            const background = this.add.image(600, 400, 'cielo').setOrigin(0.5, 0.5);
    
            // Escalar el fondo para que cubra la ventana del juego
            const scaleX = config.width / background.width; // Escala en X
            const scaleY = config.height / background.height; // Escala en Y
            const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
            background.setScale(scale); // Aplica la escala

            bird1  =  this.add.image(50, 50, 'bird').setScale(2);

            bird2  =  this.add.image(1000, 700, 'bird').setScale(1.5);


                // Crear los objetos Kinematic
            var positionBird1=new Staticc( new Vector(bird1.x, bird1.y),0);
            var velocityBird1 = new Vector(300, 0); // Inicialmente moviéndose hacia la derecha
            kinematicBird1 = new KinematicSteeringBehaviors( positionBird1, velocityBird1, 0);

            var positionBird2=new Staticc( new Vector(bird2.x, bird2.y),0);
            var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
            kinematicBird2 = new Kinematic( positionBird2, velocityBird2, 0);

            seek = new Seek(kinematicBird1,kinematicBird2 ,200);

            cursors = this.input.keyboard.createCursorKeys();


      
    }
    }
    function updateGame1(time,delta) {

        var frame = delta / 1000;

        var steering = kinematicArrive.getSteering();
        if(steering!==undefined){
            kinematicBird1.update(steering,frame);
        }

        var maxSpeed = 400;

        let steeringBird2 =  new KinematicSteeringBehaviors(new Vector(0, 0), 0);
    
        
        let previousKeyX = null; // Guardará la tecla anterior en el eje X
        let previousKeyY = null; // Guardará la tecla anterior en el eje Y

        // Verificar las teclas presionadas
        if (cursors.left.isDown) {
            // Si la tecla opuesta a la anterior es presionada, detener el movimiento
            if (previousKeyX === 'right') {
                steeringBird2.velocity.x = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x - 4, kinematicBird2.velocity.y); // Mover a la izquierda
                previousKeyX = 'left'; // Actualizar el estado anterior
            }
        } else if (cursors.right.isDown) {
            if (previousKeyX === 'left') {
                steeringBird2.velocity.x = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x + 4, kinematicBird2.velocity.y); // Mover a la derecha
                previousKeyX = 'right';
            }
        } else {
            previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
        }

        if (cursors.up.isDown) {
            if (previousKeyY === 'down') {
                steeringBird2.velocity.y = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x, kinematicBird2.velocity.y - 4); // Mover hacia arriba
                previousKeyY = 'up';
            }
        } else if (cursors.down.isDown) {
            if (previousKeyY === 'up') {
                steeringBird2.velocity.y = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x, kinematicBird2.velocity.y + 4); // Mover hacia abajo
                previousKeyY = 'down';
            }
        } else {
            previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
        }

        // Si se presionan izquierda y derecha al mismo tiempo, detener movimiento horizontal
        if (cursors.left.isDown && cursors.right.isDown) {
            steeringBird2.velocity.x = 0;
        }

        // Si se presionan arriba y abajo al mismo tiempo, detener movimiento vertical
        if (cursors.up.isDown && cursors.down.isDown) {
            steeringBird2.velocity.y = 0;
        }
       
       

          
        if (!cursors.left.isDown && !cursors.right.isDown && !cursors.up.isDown && !cursors.down.isDown) {
            kinematicBird2.velocity = new Vector(0,0);
        }
    






        

        kinematicBird2.update(steeringBird2,frame);

        if(kinematicBird2.velocity.length()> maxSpeed){
            kinematicBird2.velocity =   kinematicBird2.velocity.normalize()
            kinematicBird2.velocity =   kinematicBird2.velocity.scale(maxSpeed);
        }

        kinematicBird2.orientation = newOrientation( kinematicBird2.orientation, kinematicBird2.velocity);

        bird1.x = kinematicBird1.position.x;
        bird1.y = kinematicBird1.position.y;
        bird1.rotation = kinematicBird1.orientation;

        bird2.x = kinematicBird2.position.x;
        bird2.y = kinematicBird2.position.y;
        bird2.rotation = kinematicBird2.orientation;

       wrapAround(kinematicBird1);
        wrapAround(kinematicBird2);
    
    }

    function updateGame2(time,delta) {
        var frame = delta / 1000;

        var steering =  Kinematicflee.getSteering();
        if(steering!==undefined){
            kinematicBird1.update(steering,frame);
        }

        var maxSpeed = 400;

        let steeringBird2 =  new KinematicSteeringOutput(new Vector(0, 0), 0);
    
        
        // Definir estados previos de las teclas
        let previousKeyX = null; // Guardará la tecla anterior en el eje X
        let previousKeyY = null; // Guardará la tecla anterior en el eje Y

        // Verificar las teclas presionadas
        if (cursors.left.isDown) {
            // Si la tecla opuesta a la anterior es presionada, detener el movimiento
            if (previousKeyX === 'right') {
                steeringBird2.velocity.x = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x - 4, kinematicBird2.velocity.y); // Mover a la izquierda
                previousKeyX = 'left'; // Actualizar el estado anterior
            }
        } else if (cursors.right.isDown) {
            if (previousKeyX === 'left') {
                steeringBird2.velocity.x = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x + 4, kinematicBird2.velocity.y); // Mover a la derecha
                previousKeyX = 'right';
            }
        } else {
            previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
        }

        if (cursors.up.isDown) {
            if (previousKeyY === 'down') {
                steeringBird2.velocity.y = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x, kinematicBird2.velocity.y - 4); // Mover hacia arriba
                previousKeyY = 'up';
            }
        } else if (cursors.down.isDown) {
            if (previousKeyY === 'up') {
                steeringBird2.velocity.y = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x, kinematicBird2.velocity.y + 4); // Mover hacia abajo
                previousKeyY = 'down';
            }
        } else {
            previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
        }

        // Si se presionan izquierda y derecha al mismo tiempo, detener movimiento horizontal
        if (cursors.left.isDown && cursors.right.isDown) {
            steeringBird2.velocity.x = 0;
        }

        // Si se presionan arriba y abajo al mismo tiempo, detener movimiento vertical
        if (cursors.up.isDown && cursors.down.isDown) {
            steeringBird2.velocity.y = 0;
        }
       

          
        if (!cursors.left.isDown && !cursors.right.isDown && !cursors.up.isDown && !cursors.down.isDown) {
            kinematicBird2.velocity = new Vector(0,0);
        }
    






        

        kinematicBird2.update(steeringBird2,frame);

        if(kinematicBird2.velocity.length()> maxSpeed){
            kinematicBird2.velocity =   kinematicBird2.velocity.normalize()
            kinematicBird2.velocity =   kinematicBird2.velocity.scale(maxSpeed);
        }

        kinematicBird2.orientation = newOrientation( kinematicBird2.orientation, kinematicBird2.velocity);

        bird1.x = kinematicBird1.position.x;
        bird1.y = kinematicBird1.position.y;
        bird1.rotation = kinematicBird1.orientation;

        bird2.x = kinematicBird2.position.x;
        bird2.y = kinematicBird2.position.y;
        bird2.rotation = kinematicBird2.orientation;

        wrapAround(kinematicBird1,true);
        wrapAround(kinematicBird2);
    }

    function updateGame3(time,delta) {
        var frame = delta / 1000;

        var steering = Kinematicwander.getSteering();
        if(steering!==undefined){
            kinematicBird1.update(steering,frame);
        }

        bird1.x = kinematicBird1.position.x;
        bird1.y = kinematicBird1.position.y;
        bird1.rotation = kinematicBird1.orientation;

        var maxSpeed = 500;
        if(kinematicBird1.velocity.length()> maxSpeed){
            kinematicBird1.velocity =   kinematicBird1.velocity.normalize()
            kinematicBird1.velocity =   kinematicBird1.velocity.scale(maxSpeed);
        }

        
        wrapAround(kinematicBird1,true);
    }

    function updateGame4(time,delta){

        var frame = delta / 1000;

        var steering = seek.getSteering();
        if(steering!==undefined){
            kinematicBird1.update(steering,350,frame);
        }

        var maxSpeed = 400;

        let steeringBird2 =  new KinematicSteeringOutput(new Vector(0, 0), 0);
    
        
        let previousKeyX = null; // Guardará la tecla anterior en el eje X
        let previousKeyY = null; // Guardará la tecla anterior en el eje Y

        // Verificar las teclas presionadas
        if (cursors.left.isDown) {
            // Si la tecla opuesta a la anterior es presionada, detener el movimiento
            if (previousKeyX === 'right') {
                steeringBird2.velocity.x = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x - 4, kinematicBird2.velocity.y); // Mover a la izquierda
                previousKeyX = 'left'; // Actualizar el estado anterior
            }
        } else if (cursors.right.isDown) {
            if (previousKeyX === 'left') {
                steeringBird2.velocity.x = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x + 4, kinematicBird2.velocity.y); // Mover a la derecha
                previousKeyX = 'right';
            }
        } else {
            previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
        }

        if (cursors.up.isDown) {
            if (previousKeyY === 'down') {
                steeringBird2.velocity.y = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x, kinematicBird2.velocity.y - 4); // Mover hacia arriba
                previousKeyY = 'up';
            }
        } else if (cursors.down.isDown) {
            if (previousKeyY === 'up') {
                steeringBird2.velocity.y = 0;
            } else {
                steeringBird2.velocity = new Vector(kinematicBird2.velocity.x, kinematicBird2.velocity.y + 4); // Mover hacia abajo
                previousKeyY = 'down';
            }
        } else {
            previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
        }

        // Si se presionan izquierda y derecha al mismo tiempo, detener movimiento horizontal
        if (cursors.left.isDown && cursors.right.isDown) {
            steeringBird2.velocity.x = 0;
        }

        // Si se presionan arriba y abajo al mismo tiempo, detener movimiento vertical
        if (cursors.up.isDown && cursors.down.isDown) {
            steeringBird2.velocity.y = 0;
        }
       
       

          
        if (!cursors.left.isDown && !cursors.right.isDown && !cursors.up.isDown && !cursors.down.isDown) {
            kinematicBird2.velocity = new Vector(0,0);
        }
    






        

        kinematicBird2.update(steeringBird2,frame);

        if(kinematicBird2.velocity.length()> maxSpeed){
            kinematicBird2.velocity =   kinematicBird2.velocity.normalize()
            kinematicBird2.velocity =   kinematicBird2.velocity.scale(maxSpeed);
        }

        kinematicBird2.orientation = newOrientation( kinematicBird2.orientation, kinematicBird2.velocity);

        bird1.x = kinematicBird1.position.x;
        bird1.y = kinematicBird1.position.y;
        bird1.rotation = kinematicBird1.orientation;

        bird2.x = kinematicBird2.position.x;
        bird2.y = kinematicBird2.position.y;
        bird2.rotation = kinematicBird2.orientation;

       wrapAround(kinematicBird1,true);
        wrapAround(kinematicBird2);
        
    }

    function returnToMenu() {
        // Destruir la instancia del juego
        game.destroy(true);
        
        // Mostrar el menú nuevamente
        document.getElementById('menu').style.display = 'block';
    }


}



function handleKeyPress(key) {
    if (lastKeyPressed !== key) {
        stopMovement = true; // Detener el movimiento momentáneamente
        setTimeout(() => {
            stopMovement = false; // Reanudar movimiento después del tiempo establecido
        }, stopTime);
        lastKeyPressed = key; // Actualizar el estado de la última tecla presionada
    }
}