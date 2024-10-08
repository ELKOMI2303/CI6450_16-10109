
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

function mapToRange(angle) {
  return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
}

class Vector {
  constructor(x = 0, y = 0) {
    // Cambiado de z a y
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

  clone() {
    return new Vector(this.x, this.y);
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

class Staticc {
  constructor(position = new Vector(), orientation) {
    this.position = position;
    this.orientation = orientation;
  }
}

class Anothercharacter {
  constructor(position = new Vector(), orientation, velocity = new Vector()) {
    this.position = position;
    this.orientation = orientation;
    this.velocity = velocity;
  }
}


class Kinematic {
  constructor(staticc = new Staticc(), velocity, rotation) {
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
  constructor(staticc = new Staticc(), velocity, rotation) {
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

class KinematicSteeringBehaviors {
  constructor(staticc = new Staticc(), velocity, rotation) {
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

    if (this.velocity.length() > maxSpeed) {
      this.velocity = this.velocity.normalize();
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
    this.character.orientation = newOrientation(
      this.character.orientation,
      result.velocity
    );

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
    result.velocity = this.character.position.subtract(this.target.position);

    const distance = result.velocity.length(); // Obtener la distancia al objetivo

    // Si estamos dentro del radio interior, el personaje se detiene
    if (distance > this.radius) {
      result.velocity = new Vector(0, 0);
      return result; // No hacer nada, detener el movimiento
    }

    // Ajustar la velocidad para que el personaje llegue en timeToTarget segundos
    result.velocity = result.velocity.scale(1 / this.timeToTarget);

    // Si la velocidad es mayor que la velocidad máxima, normalizar
    if (result.velocity.length() > this.maxSpeed) {
      result.velocity = result.velocity.normalize().scale(this.maxSpeed);
    }

    // Orientación hacia la dirección de movimiento usando newOrientation
    this.character.orientation = newOrientation(
      this.character.orientation,
      result.velocity
    );

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
    let result = new SteeringOutput();

    // Generar una rotación aleatoria
    var random = this.randomBinomial()
    let randomRotation = random * this.maxRotation;

    // Actualizar la rotación del personaje
    this.character.orientation += randomRotation;

    var asVector = this.asVector().scale(this.maxSpeed);
    // Establecer la nueva velocidad
    result.linear = asVector;
    result.angular = randomRotation;

    return result;
  }

  // Función que genera un valor aleatorio entre -1 y 1
  randomBinomial() {
    return Math.random() - Math.random();
  }

  asVector() {
    return new Vector(
      Math.cos(this.character.orientation),
      Math.sin(this.character.orientation)
    );
  }
}

class Seek {
  constructor(character, target, maxAcceleration) {
    this.character = character; // Kinematic
    this.target = target; // Kinematic
    this.maxAcceleration = maxAcceleration;
  }

  getSteering() {
    var result = new SteeringOutput();

    result.linear = this.target.position.subtract(this.character.position);

    result.linear = result.linear.normalize();

    result.linear = result.linear.scale(this.maxAcceleration);

    this.character.orientation = newOrientation(
      this.character.orientation,
      this.character.velocity
    );

    result.angular = 0;

    return result;
  }
}

class Flee {
  constructor(character, target, maxAcceleration) {
    this.character = character; // Kinematic
    this.target = target; // Kinematic
    this.maxAcceleration = maxAcceleration;
  }

  getSteering() {
    var result = new SteeringOutput();

    result.linear = this.character.position.subtract(this.target.position);

    const distance = result.linear.length();

    if (distance > 300) {
      result.linear = new Vector(0, 0);
      this.character.velocity = new Vector(0, 0);
      return result;
    }

    result.linear = result.linear.normalize();

    result.linear = result.linear.scale(this.maxAcceleration);

    this.character.orientation = newOrientation(
      this.character.orientation,
      this.character.velocity
    );

    result.angular = 0;

    return result;
  }
}

class Arrive {
  constructor(
    character,
    target,
    maxAcceleration,
    maxSpeed,
    targetRadius,
    slowRadius,
    timeToTarget = 0.1
  ) {
    this.character = character; // Kinematic
    this.target = target; // Kinematic
    this.maxAcceleration = maxAcceleration;
    this.maxSpeed = maxSpeed;
    this.targetRadius = targetRadius;
    this.slowRadius = slowRadius;
    this.timeToTarget = timeToTarget;
  }

  getSteering() {
    var result = new SteeringOutput();
    var targetSpeed;
    var direccion = this.target.position.subtract(this.character.position);

    var distance = direccion.length();

    if (distance < this.targetRadius) return null;

    if (distance > this.slowRadius) targetSpeed = this.maxSpeed;
    else targetSpeed = (this.maxSpeed * distance) / this.slowRadius;

    var targetVelocity = direccion;
    targetVelocity = targetVelocity.normalize();
    targetVelocity = targetVelocity.scale(targetSpeed);

    result.linear = targetVelocity.subtract(this.character.velocity);
    result.linear = result.linear.scale(1 / this.timeToTarget);

    if (result.linear.length() > this.maxAcceleration) {
      result.linear = result.linear.normalize();
      result.linear = result.linear.scale(this.maxAcceleration);
    }

    this.character.orientation = newOrientation(
      this.character.orientation,
      this.character.velocity
    );

    result.angular = 0;

    return result;
  }
}




class Align {
  constructor(
    character,
    target,
    maxAngularAcceleration,
    maxRotation,
    targetRadius,
    slowRadius,
    timeToTarget = 0.1
  ) {
    this.character = character; // Kinematic
    this.target = target; // Kinematic
    this.maxAngularAcceleration = maxAngularAcceleration;
    this.maxRotation = maxRotation;
    this.targetRadius = targetRadius;
    this.slowRadius = slowRadius;
    this.timeToTarget = timeToTarget;
  }

  getSteering() {
    var result = new SteeringOutput();
    var targetRotation;
    var rotation = this.target.orientation - this.character.orientation;

    rotation = mapToRange(rotation);

    var rotationSize = Math.abs(rotation);

    if (rotationSize < this.targetRadius) return null;

    if (rotationSize > this.slowRadius) targetRotation = this.maxRotation;
    else targetRotation = this.maxRotation * (rotationSize / this.slowRadius);

    targetRotation = targetRotation * (rotation / rotationSize);

    result.angular = targetRotation - this.character.rotation;
    result.angular = result.angular / this.timeToTarget;

    var angularAcceleration = Math.abs(result.angular);

    if (angularAcceleration > this.maxAngularAcceleration) {
      result.angular = result.angular / angularAcceleration;
      result.angular = result.angular * this.maxAngularAcceleration;
    }

    result.linear = new Vector(0, 0);

    return result;
  }

}


class Face extends Align {
  constructor(
    character,
    target,
    maxAngularAcceleration,
    maxRotation,
    targetRadius,
    slowRadius,
    timeToTarget = 0.1
  ) {
    super(
      character,
      target,
      maxAngularAcceleration,
      maxRotation,
      targetRadius,
      slowRadius,
      (timeToTarget = 0.1)
    );
  }

  getSteering() {
    var direction = this.target.position.subtract(this.character.position);

    if (direction.length() === 0) {
      return this.target;
    }

    this.target = explicitTarget;
    this.target.orientation = Math.atan2(direction.y, direction.x);
    return super.getSteering();
  }
}

class VelocityMatch {
  constructor(character, target, maxAcceleration, timeToTarget = 0.1) {
    this.character = character;
    this.target = target;
    this.maxAcceleration = maxAcceleration;
    this.timeToTarget = timeToTarget;
  }

  getSteering() {
    var result = new SteeringOutput();

    result.linear = this.target.velocity.subtract(this.character.velocity);

    result.linear = result.linear.scale(1 / this.timeToTarget);

    if (result.linear.length() > this.maxAcceleration) {
      result.linear = result.linear.normalize();
      result.linear = result.linear.scale(this.maxAcceleration);
    }

    result.angular = 0;

    return result;
  }
}

class Pursue extends Seek {
  constructor(character, target, maxAcceleration, maxPrediction) {
    super(character, target, maxAcceleration);
    this.maxPrediction = maxPrediction;
  }

  getSteering() {
    var prediction;
    var direccion = this.target.position.subtract(this.character.position);

    var distance = direccion.length();

    var speed = this.character.velocity.length();

    if (speed <= distance / this.maxPrediction) {
      prediction = this.maxPrediction;
    } else {
      prediction = distance / speed;
    }

    // Validar si explicitTarget es una variable global
    this.target = explicitTarget;
    this.target.position = this.target.position.add(
      this.target.velocity.scale(prediction)
    );
    return super.getSteering();
  }
}

class Evade extends Flee {
  constructor(character, target, maxAcceleration, maxPrediction) {
    super(character, target, maxAcceleration);
    this.maxPrediction = maxPrediction;
  }

  getSteering() {
    var prediction;
    var direccion = this.target.position.subtract(this.character.position);

    var distance = direccion.length();

    var speed = this.character.velocity.length();

    if (speed <= distance / this.maxPrediction) {
      prediction = this.maxPrediction;
    } else {
      prediction = distance / speed;
    }

    // Validar si explicitTarget es una variable global
    this.target = explicitTarget;
    this.target.position = this.target.position.add(
      this.target.velocity.scale(prediction)
    );
    return super.getSteering();
  }
}

class LookWhereYouAregoing extends Align{
  constructor( character,
    target,
    maxAngularAcceleration,
    maxRotation,
    targetRadius,
    slowRadius,
    timeToTarget = 0.1){
    super( character,
        target,
        maxAngularAcceleration,
        maxRotation,
        targetRadius,
        slowRadius,
        timeToTarget = 0.1)
  }

  getSteering(){
    var velocity = this.character.velocity

    if(velocity.length()===0){
      return null
    }

    this.target.orientation = Math.atan2(velocity.y,velocity.x);
    return super.getSteering();
  }
}

class Wander extends Face {
  constructor(
    character,
    target,
    maxAngularAcceleration,
    maxRotation,
    targetRadius,
    slowRadius,
    timeToTarget = 0.1,
    wanderOffset,
    wanderRadius,
    wanderRate,
    wanderOrientation,
    maxAcceleration
  ) {
    super(
      character,
      target,
      maxAngularAcceleration,
      maxRotation,
      targetRadius,
      slowRadius,
      (timeToTarget = 0.1)
    );
    this.wanderOffset = wanderOffset;
    this.wanderRadius = wanderRadius;
    this.wanderRate = wanderRate;
    this.wanderOrientation = wanderOrientation;
    this.maxAcceleration = maxAcceleration;
  }

  getSteering() {
    var random = this.randomBinomial();
    this.wanderOrientation += random * this.wanderRate;
    var targetOrientation = this.wanderOrientation + this.character.orientation;
    var newAsVector = this.asVector(this.character.orientation);
    this.target.position = this.character.position.add(
      newAsVector.scale(this.wanderOffset)
    );
    newAsVector = this.asVector(targetOrientation);
    this.target.position = this.target.position.add(
      newAsVector.scale(this.wanderRadius)
    );

    //Para Ejecutar Seek
    explicitTargetToSeek.position = this.target.position;

    var result = super.getSteering();
    newAsVector = this.asVector(this.character.orientation);

    result.linear = newAsVector.scale(this.maxAcceleration);

    return result;
  }

  randomBinomial() {
    return Math.random() - Math.random();
  }
  asVector(angle) {
    return new Vector(Math.sin(angle), Math.cos(angle)).normalize();
  }
}

class Separation {
  constructor(character, targets, threshold, maxAcceleration,decayCoefficient  ) {
    this.character = character;
    this.targets = targets;

    this.threshold = threshold || 50; // píxeles
    this.maxAcceleration = maxAcceleration || 1000; // píxeles/s²
    this.decayCoefficient = decayCoefficient || 1000; // Ajusta según sea necesario
  }

  getSteering() {
    const result = new SteeringOutput();
    let totalRepulsion = new Vector(0, 0);

    for (let target of this.targets) {
      // No considerar al mismo personaje
      if (target === this.character) continue;

      // Calcular la dirección y distancia entre el personaje y el target
      let direction = this.character.position.subtract(target.position);
      let distance = direction.length();

      if (distance < this.threshold && distance > 0) {
        // Calcular la fuerza de repulsión usando la ley del cuadrado inverso
        let strength = Math.min(
          this.decayCoefficient / (distance * distance),
          this.maxAcceleration
        );

        // Normalizar la dirección y escalar por la fuerza
        let repulsion = direction.normalize().scale(strength);

        // Acumular la repulsión total
        totalRepulsion = totalRepulsion.add(repulsion);
      }
    }

    // Limitar la fuerza total a la aceleración máxima
    if (totalRepulsion.length() > this.maxAcceleration) {
      totalRepulsion = totalRepulsion.normalize().scale(this.maxAcceleration);
    }

    result.linear = totalRepulsion;

    return result;
  }
}

const MAP_HEIGHT = 775;
const  MAP_WIDTH = 1175;

class ObstacleAvoidance extends Seek {
  constructor(character,target,maxAcceleration,detector, avoidDistance, lookahead) {
      super(character,target,maxAcceleration);
      this.detector = detector;
      this.avoidDistance = avoidDistance;
      this.lookahead = lookahead;
  }

  getSteering() {
      // 1. Calcular el vector del rayo de colisión.
      const ray = this.character.velocity.clone().normalize().scale(this.lookahead);

      // 2. Buscar la colisión.
      const collision = this.detector.getCollision(this.character.position, ray);

      // Si no hay colisión, no hacer nada.
      if (!collision) {
          return null;
      }

        // Ajustar la nueva posición usando la normal
      const penetrationDepth = this.character.velocity.length(); // Profundidad de penetración
      const adjustedPosition = collision.position.subtract(collision.normal).scale(penetrationDepth);


      this.target = new KinematicSteeringBehaviors(
          new Staticc(adjustedPosition,0),
          new Vector(0, 0),
          0
      );

      return super.getSteering();
  }
}



class CollisionDetector {
  constructor(walls, obstacles) {
      this.walls = walls; // Array de objetos que representan los muros
      this.obstacles = obstacles; // Array de objetos que representan obstáculos adicionales



    // Agregar bordes del mapa como paredes
    this.walls.push({ x: 0, y: MAP_HEIGHT / 2, width: 10, height: MAP_HEIGHT }); // Pared izquierda
    this.walls.push({ x: MAP_WIDTH, y: MAP_HEIGHT / 2, width: 10, height: MAP_HEIGHT }); // Pared derecha
    this.walls.push({ x: MAP_WIDTH / 2, y: 0, width: MAP_WIDTH, height: 10 }); // Pared superior
    this.walls.push({ x: MAP_WIDTH / 2, y: MAP_HEIGHT, width: MAP_WIDTH, height: 10 }); // Pared inferior
  }

  getCollision(start, ray) {
      let closestCollision = null;
      let minDistance = Infinity;

      // Combina paredes y obstáculos para verificar colisiones
      const allObjects = [...this.walls, ...this.obstacles];

      for (const obj of allObjects) {
          const collision = this.checkRayCollision(start, ray, obj);
          if (collision && collision.distance < minDistance) {
              minDistance = collision.distance;
              closestCollision = collision;
          }
      }

      return closestCollision;
  }

  checkRayCollision(start, ray, obj) {
      // Suponiendo que obj tiene propiedades x, y, width, height
      // Calculamos los límites del rectángulo
      const rect = {
          x: obj.x - obj.width / 2,
          y: obj.y - obj.height / 2,
          width: obj.width,
          height: obj.height
      };

      // Definir los cuatro bordes del rectángulo
      const edges = [
          { start: new Vector(rect.x, rect.y), end: new Vector(rect.x + rect.width, rect.y) }, // Top
          { start: new Vector(rect.x + rect.width, rect.y), end: new Vector(rect.x + rect.width, rect.y + rect.height) }, // Right
          { start: new Vector(rect.x + rect.width, rect.y + rect.height), end: new Vector(rect.x, rect.y + rect.height) }, // Bottom
          { start: new Vector(rect.x, rect.y + rect.height), end: new Vector(rect.x, rect.y) } // Left
      ];

      let closestIntersection = null;
      let minDistance = Infinity;

      for (const edge of edges) {
          const intersection = this.getLineIntersection(start, ray.add(start), edge.start, edge.end);
          if (intersection) {
              const distance = start.subtract(intersection).length();
              if (distance < minDistance) {
                  minDistance = distance;
                  // Calcula la normal de la colisión
                  const edgeVector = edge.end.subtract(edge.start).normalize();
                  const normal = new Vector(-edgeVector.y, edgeVector.x); // Perpendicular
                  closestIntersection = {
                      position: intersection,
                      normal: normal,
                      distance: distance
                  };
              }
          }
      }

      return closestIntersection;
  }

  getLineIntersection(p1, p2, p3, p4) {
      const denominator = (p1.x - p2.x) * (p3.y - p4.y) - 
                          (p1.y - p2.y) * (p3.x - p4.x);
      if (denominator === 0) return null; // Líneas paralelas

      const t = ((p1.x - p3.x) * (p3.y - p4.y) - 
                 (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
      const u = ((p1.x - p3.x) * (p1.y - p2.y) - 
                 (p1.y - p3.y) * (p1.x - p2.x)) / denominator;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
          return new Vector(
              p1.x + t * (p2.x - p1.x),
              p1.y + t * (p2.y - p1.y)
          );
      }

      return null; // No hay intersección
  }
}




var buttons = document.querySelectorAll(".arcade-button");
buttons.forEach((button) => {
  // Obtenemos el valor del atributo 'data-game-option'
  const option = button.getAttribute("data-game-option");
  button.addEventListener("click", () => {
    startPhaserGame(option);
  });
});

const worldWidth = 1200;
const worldHeight = 800;

// Función para teletransportar un objeto si sale de los límites
function wrapAround(kinematic, transportToCenter = false, randomizePosition = false) {
  if (transportToCenter) {
    // Si el kinematic sale de los límites, lo transportamos al centro
    if (
      kinematic.position.x < 0 ||
      kinematic.position.x > worldWidth ||
      kinematic.position.y < 0 ||
      kinematic.position.y > worldHeight
    ) {
      if (randomizePosition) {
        // Aparecer en una posición aleatoria
        kinematic.position.x = Math.random() * worldWidth;
        kinematic.position.y = Math.random() * worldHeight;
      } else {
        // Transportar al centro del mapa
        kinematic.position.x = worldWidth / 2;
        kinematic.position.y = worldHeight / 2;
      }
    }
  } else {
    // Comportamiento de wrap around normal
    if (kinematic.position.x < 0 || kinematic.position.x > worldWidth || 
        kinematic.position.y < 0 || kinematic.position.y > worldHeight) {
      if (randomizePosition) {
        // Aparecer en una posición aleatoria
        kinematic.position.x = Math.random() * worldWidth;
        kinematic.position.y = Math.random() * worldHeight;
      } else {
        // Wrap around normal
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
  }
}

var bird1, bird2, bird3, bird4, bird5, bird6,bird7,bird8,bird9,bird10,bird11;
var kinematicBird1,
  kinematicBird2,
  kinematicBird3,
  kinematicBird4,
  kinematicBird5,
  kinematicBird6,
  kinematicBird7,
  kinematicBird8,
  kinematicBird9,
  kinematicBird10,
  kinematicBird11;
var kinematicArrive, Kinematicflee, Kinematicwander, dynamicseek, dynamicflee;
var dynamicarrive, aling, velocitymatching;
var explicitTarget, face, face2, face3, face4, face5, pursue, evade, wander 
var separation1,separation2,separation3,separation4,separation5,separation6,separation7,separation8,separation9,separation10
var vl1,vl2,vl3,vl4,vl5,vl6,vl7,vl8,vl9,vl10;
var explicitTargetToSeek, walls,obstacles,collisiondetector,obstacleavoidance,initial_target,lwyag;

function startPhaserGame(option) {
  // Oculta el menú
  document.getElementById("menu").style.display = "none";

  // Inicia el juego en Phaser
  const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    backgroundColor: "#FFFFFF",
    scene: {
      preload: preloadGame,
      create: createGame,
      update:
        option === "option1"
          ? updateGame1
          : option === "option2"
          ? updateGame2
          : option === "option3"
          ? updateGame3
          : option === "option4"
          ? updateGame4
          : option === "option5"
          ? updateGame5
          : option === "option6"
          ? updateGame6
          : option === "option7"
          ? updateGame7
          : option === "option8"
          ? updateGame8
          : option === "option9"
          ? updateGame9
          : option === "option10"
          ? updateGame10
          : option === "option11"
          ? updateGame11
          : option === 'option12'
          ? updateGame12
          : option === "option13"
          ? updateGame13
          : updateGame14,
    },
  };
  const game = new Phaser.Game(config);

  function preloadGame() {
    // Cargar assets según la opción seleccionada
    this.load.image("cielo", "./assets/cielo.png");
    this.load.image("bird", "./assets/bird.png");

    this.load.image("birdm", "./assets/birdm.png");
    this.load.image("birdd", "./assets/birdd.png");
    this.load.image("birdu", "./assets/birdu.png");
    this.load.image("bird2m", "./assets/bird2m.png");
    this.load.image("bird2d", "./assets/bird2d.png");
    this.load.image("bird2u", "./assets/bird2u.png");

    this.load.image('block', './assets/block.png');
  }

  function createGame() {
    // Configurar el evento de teclado
    this.input.keyboard.on("keydown-ESC", returnToMenu);

    this.anims.create({
      key: "fly2",
      frames: [{ key: "bird2u" }, { key: "bird2m" }, { key: "bird2d" }],
      frameRate: 10, // Ajusta la velocidad de la animación según tu preferencia
      repeat: -1, // Repite indefinidamente
    });

    this.anims.create({
      key: "fly",
      frames: [{ key: "birdu" }, { key: "birdm" }, { key: "birdd" }],
      frameRate: 10, // Ajusta la velocidad de la animación según tu preferencia
      repeat: -1, // Repite indefinidamente
    });

    // Lógica específica para cada opción
    if (option === "option1") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(50, 50, "birdu").setScale(2);

      bird2 = this.add.sprite(600, 400, "bird2u").setScale(1.5);
      bird1.play("fly");
      bird2.play("fly2");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(300, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new Kinematic(positionBird1, velocityBird1, 0);

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      kinematicArrive = new KinematicArrive(
        kinematicBird1,
        kinematicBird2,
        200,
        1,
        0.75
      );

      cursors = this.input.keyboard.createCursorKeys();

      // Configurar lógica de juego 1
    } else if (option === "option2") {
      //KinematicFlee

      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(150, 150, "birdu").setScale(2);

      bird2 = this.add.sprite(1000, 700, "bird2u").setScale(1.5);
      bird1.play("fly");
      bird2.play("fly2");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new Kinematic(positionBird1, velocityBird1, 0);

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      Kinematicflee = new KinematicFlee(
        kinematicBird1,
        kinematicBird2,
        350,
        400,
        0.75
      );

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option3") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(50, 50, "birdu").setScale(1.5);

      bird1.play("fly");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(
        new Vector(bird1.x, bird1.y),
        Math.PI / 4
      );
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicForWander(positionBird1, velocityBird1, 0);

      Kinematicwander = new KinematicWander(kinematicBird1, 50, Math.PI / 6);
    } else if (option === "option4") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(50, 50, "birdu").setScale(2);

      bird2 = this.add.sprite(600, 700, "bird2u").setScale(1.5);
      bird1.play("fly");
      bird2.play("fly2");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(75, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      dynamicseek = new Seek(kinematicBird1, kinematicBird2, 100);

  

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option5") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(50, 50, "birdu").setScale(2);

      bird2 = this.add.sprite(1000, 700, "bird2u").setScale(1.5);
      bird1.play("fly");
      bird2.play("fly2");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      dynamicflee = new Flee(kinematicBird1, kinematicBird2, 200);

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option6") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(50, 50, "birdu").setScale(2);

      bird2 = this.add.sprite(1000, 700, "bird2u").setScale(1.5);
      bird1.play("fly");
      bird2.play("fly2");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      dynamicarrive = new Arrive(
        kinematicBird1,
        kinematicBird2,
        600,
        6000,
        25,
        5,
        0.75
      );

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option7") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(400, 400, "birdu").setScale(2);

      bird2 = this.add.sprite(600, 400, "bird2u").setScale(1.5);
      bird1.play("fly");
      bird2.play("fly2");
      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      aling = new Align(
        kinematicBird1,
        kinematicBird2,
        Math.PI,
        Math.PI / 4,
        0.01,
        0.1,
        0.1
      );

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option8") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(600, 300, "birdu").setScale(2);

      bird2 = this.add.sprite(600, 600, "bird2u").setScale(1.5);
      bird1.play("fly");
      bird2.play("fly2");
      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      // aling = new Aling( kinematicBird1, kinematicBird2, 0.1,0.6,1.5708, 2.5,0.1);

      velocitymatching = new VelocityMatch(
        kinematicBird1,
        kinematicBird2,
        300,
        0.75
      );

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option9") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(600, 600, "birdu").setScale(2);

      bird2 = this.add.sprite(600, 400, "bird2u").setScale(1.5);

      bird3 = this.add.sprite(50, 200, "birdu").setScale(2);

      bird4 = this.add.sprite(1000, 400, "birdu").setScale(2);

      bird5 = this.add.sprite(600, 100, "birdu").setScale(2);

      bird6 = this.add.sprite(50, 400, "birdu").setScale(2);

      bird1.play("fly");
      bird2.play("fly2");
      bird3.play("fly");
      bird4.play("fly");
      bird5.play("fly");
      bird6.play("fly");
      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird3 = new Staticc(new Vector(bird3.x, bird3.y), 0);
      var velocityBird3 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird3 = new KinematicSteeringBehaviors(
        positionBird3,
        velocityBird3,
        0
      );

      var positionBird4 = new Staticc(new Vector(bird4.x, bird4.y), 0);
      var velocityBird4 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird4 = new KinematicSteeringBehaviors(
        positionBird4,
        velocityBird4,
        0
      );

      var positionBird5 = new Staticc(new Vector(bird5.x, bird5.y), 0);
      var velocityBird5 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird5 = new KinematicSteeringBehaviors(
        positionBird5,
        velocityBird5,
        0
      );

      var positionBird6 = new Staticc(new Vector(bird6.x, bird6.y), 0);
      var velocityBird6 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird6 = new KinematicSteeringBehaviors(
        positionBird6,
        velocityBird6,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      // aling = new Aling( kinematicBird1, kinematicBird2, 0.1,0.6,1.5708, 2.5,0.1);

      explicitTarget = new KinematicSteeringBehaviors(
        new Staticc(
          kinematicBird2.position.clone(),
          kinematicBird2.orientation
        ),
        kinematicBird2.velocity.clone(),
        kinematicBird2.rotation
      );

      face = new Face(
        kinematicBird1,
        kinematicBird2,
        Math.PI,
        Math.PI / 4,
        0.01,
        0.1,
        0.1
      );

      face2 = new Face(
        kinematicBird3,
        kinematicBird2,
        Math.PI,
        Math.PI / 4,
        0.01,
        0.1,
        0.1
      );

      face3 = new Face(
        kinematicBird4,
        kinematicBird2,
        Math.PI,
        Math.PI / 4,
        0.01,
        0.1,
        0.1
      );

      face4 = new Face(
        kinematicBird5,
        kinematicBird2,
        Math.PI,
        Math.PI / 4,
        0.01,
        0.1,
        0.1
      );

      face5 = new Face(
        kinematicBird6,
        kinematicBird2,
        Math.PI,
        Math.PI / 4,
        0.01,
        0.1,
        0.1
      );

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option10") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(50, 50, "birdu").setScale(2);

      bird2 = this.add.sprite(1000, 700, "bird2u").setScale(1.5);

      bird3 = this.add.sprite(1000, 50, "birdu").setScale(2);
      bird1.play("fly");
      bird3.play("fly");
      bird2.play("fly2");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(300, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      // Crear los objetos Kinematic
      var positionBird3 = new Staticc(new Vector(bird3.x, bird3.y), 0);
      var velocityBird3 = new Vector(300, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird3 = new KinematicSteeringBehaviors(
        positionBird3,
        velocityBird3,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      explicitTarget = new KinematicSteeringBehaviors(
        new Staticc(
          kinematicBird2.position.clone(),
          kinematicBird2.orientation
        ),
        kinematicBird2.velocity.clone(),
        kinematicBird2.rotation
      );

      pursue = new Pursue(kinematicBird1, kinematicBird2, 300, 100);

      evade = new Evade(kinematicBird3, kinematicBird2, 300, 100);

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option11") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      bird1 = this.add.sprite(50, 50, "birdu").setScale(2);

      bird2 = this.add.sprite(1000, 700, "bird2u").setScale(1.5);

      bird1.play("fly");
      bird2.play("fly2");

      // Crear los objetos Kinematic
      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(300, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      pursue = new Pursue(kinematicBird1, kinematicBird2, 300, 100);


      evade = new Evade(kinematicBird2, kinematicBird1, 300, 100);

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option12") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala

      // bird1 = this.add.sprite(600, 600, "birdu").setScale(2);

      bird2 = this.add.sprite(600, 400, "bird2u").setScale(1.5);

      // bird3 = this.add.sprite(50, 200, "birdu").setScale(2);

      // bird4 = this.add.sprite(1000, 400, "birdu").setScale(2);

      // bird5 = this.add.sprite(600, 100, "birdu").setScale(2);

      // bird6 = this.add.sprite(50, 400, "birdu").setScale(2);

      // bird1.play("fly");
      bird2.play("fly2");
      // bird3.play("fly");
      // bird4.play("fly");
      // bird5.play("fly");
      // bird6.play("fly");
      // Crear los objetos Kinematic
      // var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 4);
      // var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      // kinematicBird1 = new KinematicSteeringBehaviors(
      //   positionBird1,
      //   velocityBird1,
      //   0
      // );

      // var positionBird3 = new Staticc(new Vector(bird3.x, bird3.y), 4);
      // var velocityBird3 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      // kinematicBird3 = new KinematicSteeringBehaviors(
      //   positionBird3,
      //   velocityBird3,
      //   0
      // );

      // var positionBird4 = new Staticc(new Vector(bird4.x, bird4.y), 4);
      // var velocityBird4 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      // kinematicBird4 = new KinematicSteeringBehaviors(
      //   positionBird4,
      //   velocityBird4,
      //   0
      // );

      // var positionBird5 = new Staticc(new Vector(bird5.x, bird5.y), 4);
      // var velocityBird5 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      // kinematicBird5 = new KinematicSteeringBehaviors(
      //   positionBird5,
      //   velocityBird5,
      //   0
      // );

      // var positionBird6 = new Staticc(new Vector(bird6.x, bird6.y), 4);
      // var velocityBird6 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      // kinematicBird6 = new KinematicSteeringBehaviors(
      //   positionBird6,
      //   velocityBird6,
      //   0
      // );

      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      // aling = new Aling( kinematicBird1, kinematicBird2, 0.1,0.6,1.5708, 2.5,0.1);

      explicitTarget = new KinematicSteeringBehaviors(
        new Staticc(
          kinematicBird2.position.clone(),
          kinematicBird2.orientation
        ),
        kinematicBird2.velocity.clone(),
        kinematicBird2.rotation
      );

      wander = new Wander(
        kinematicBird2,
        explicitTarget,
        0.05, // Aceleración angular máxima
        Math.PI, // Rotación máxima (45 grados)
        1.0, // Radio del objetivo
        2.5, // Radio de desaceleración
        0.1,
        20.0,
        5.0,
        0.5,
        3.0,
        100
      );

      cursors = this.input.keyboard.createCursorKeys();
    } else if (option === "option13") {
      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);

      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = config.width / background.width; // Escala en X
      const scaleY = config.height / background.height; // Escala en Y
      const scale = Math.max(scaleX, scaleY); // Escoge el mayor para cubrir todo
      background.setScale(scale); // Aplica la escala
      bird1 = this.add.sprite(500, 400, "birdu").setScale(2);
      bird2 = this.add.sprite(500, 401, "birdu").setScale(2);
      bird3 = this.add.sprite(500, 402, "birdu").setScale(2);
      bird4 = this.add.sprite(500, 403, "birdu").setScale(2);

      bird5 = this.add.sprite(505, 410, "birdu").setScale(2);
      bird6 = this.add.sprite(505, 411, "birdu").setScale(2);
      bird7 = this.add.sprite(505, 412, "birdu").setScale(2);


      bird8 = this.add.sprite(510, 420, "birdu").setScale(2);
      bird9 = this.add.sprite(510, 421, "birdu").setScale(2);

      bird10 = this.add.sprite(515, 430, "birdu").setScale(2);


      bird11 = this.add.sprite(800, 400, "bird2u").setScale(1.5);

      bird1.play("fly");
      bird2.play("fly");
      bird3.play("fly");
      bird4.play("fly");

      bird5.play("fly");
      bird6.play("fly");
      bird7.play("fly");

      bird8.play("fly");
      bird9.play("fly");

      bird10.play("fly");

      
      bird11.play("fly2");
    
      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      var positionBird1 = new Staticc(new Vector(bird1.x, bird1.y), 0);
      var velocityBird1 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird1 = new KinematicSteeringBehaviors(
        positionBird1,
        velocityBird1,
        0
      );

      var positionBird3 = new Staticc(new Vector(bird3.x, bird3.y), 0);
      var velocityBird3 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird3 = new KinematicSteeringBehaviors(
        positionBird3,
        velocityBird3,
        0
      );

      var positionBird4 = new Staticc(new Vector(bird4.x, bird4.y), 0);
      var velocityBird4 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird4 = new KinematicSteeringBehaviors(
        positionBird4,
        velocityBird4,
        0
      );

      var positionBird5 = new Staticc(new Vector(bird5.x, bird5.y), 0);
      var velocityBird5 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird5 = new KinematicSteeringBehaviors(
        positionBird5,
        velocityBird5,
        0
      );

      var positionBird6 = new Staticc(new Vector(bird6.x, bird6.y), 0);
      var velocityBird6 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird6 = new KinematicSteeringBehaviors(
        positionBird6,
        velocityBird6,
        0
      );

      var positionBird7 = new Staticc(new Vector(bird7.x, bird7.y), 0);
      var velocityBird7 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird7 = new KinematicSteeringBehaviors(
        positionBird7,
        velocityBird7,
        0
      );

      var positionBird8 = new Staticc(new Vector(bird8.x, bird8.y), 0);
      var velocityBird8 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird8 = new KinematicSteeringBehaviors(
        positionBird8,
        velocityBird8,
        0
      );

      var positionBird9 = new Staticc(new Vector(bird9.x, bird9.y), 0);
      var velocityBird9 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird9 = new KinematicSteeringBehaviors(
        positionBird9,
        velocityBird9,
        0
      );

      var positionBird10 = new Staticc(new Vector(bird10.x, bird10.y), 0);
      var velocityBird10 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird10 = new KinematicSteeringBehaviors(
        positionBird10,
        velocityBird10,
        0
      );





      var positionBird11 = new Staticc(new Vector(bird11.x, bird11.y), 0);
      var velocityBird11 = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
      kinematicBird11 = new KinematicSteeringBehaviors(
        positionBird11,
        velocityBird11,
        0
      );

      vl1 = new VelocityMatch(kinematicBird1,kinematicBird11,300,0.75)
      vl2 = new VelocityMatch(kinematicBird2,kinematicBird11,300,0.75)
      vl3 = new VelocityMatch(kinematicBird3,kinematicBird11,300,0.75)
      vl4 = new VelocityMatch(kinematicBird4,kinematicBird11,300,0.75)
      vl5 = new VelocityMatch(kinematicBird5,kinematicBird11,300,0.75)
      vl6 = new VelocityMatch(kinematicBird6,kinematicBird11,300,0.75)
      vl7 = new VelocityMatch(kinematicBird7,kinematicBird11,300,0.75)
      vl8 = new VelocityMatch(kinematicBird8,kinematicBird11,300,0.75)
      vl9 = new VelocityMatch(kinematicBird9,kinematicBird11,300,0.75)
      vl10 = new VelocityMatch(kinematicBird10,kinematicBird11,300,0.75)



      separation1 = new Separation(kinematicBird1,[kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird9,kinematicBird10],600,1000,1000);
      separation2 = new Separation(kinematicBird2,[kinematicBird1,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird9,kinematicBird10],600,1000,1000);
      separation3 = new Separation(kinematicBird3,[kinematicBird1,kinematicBird2,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird9,kinematicBird10],600,1000,1000);
      separation4 = new Separation(kinematicBird4,[kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird9,kinematicBird10],600,1000,1000);
      separation5 = new Separation(kinematicBird5,[kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird9,kinematicBird10],600,1000,1000);
      separation6 = new Separation(kinematicBird6,[kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird7,kinematicBird8,kinematicBird9,kinematicBird10],600,1000,1000);
      separation7 = new Separation(kinematicBird7,[kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird8,kinematicBird9,kinematicBird10],600,1000,1000);
      separation8 = new Separation(kinematicBird8,[kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird9,kinematicBird10],600,1000,1000);
      separation9 = new Separation(kinematicBird9,[kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird10],600,1000,1000);
      separation10 = new Separation(kinematicBird10,[kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird9],600,1000,1000);



      cursors = this.input.keyboard.createCursorKeys();
    }else if(option === "option14"){

      const background = this.add.image(600, 400, "cielo").setOrigin(0.5, 0.5);
        
      // Escalar el fondo para que cubra la ventana del juego
      const scaleX = this.sys.game.config.width / background.width;
      const scaleY = this.sys.game.config.height / background.height;
      const scale = Math.max(scaleX, scaleY);
      background.setScale(scale);

  
      bird2 = this.add.sprite(600, 400, "bird2u").setScale(1.5);
  
      bird2.play("fly2");

      initial_target =new KinematicSteeringBehaviors(
        new Staticc(new Vector(0,0),0),
        new Vector(0,0),
        0
      );


      var positionBird2 = new Staticc(new Vector(bird2.x, bird2.y), 0);
      var velocityBird2 = new Vector(50,100); // Inicialmente moviéndose hacia la derecha
      kinematicBird2 = new KinematicSteeringBehaviors(
        positionBird2,
        velocityBird2,
        0
      );

      // 2. Crear muros
      const blockSize = 16;   
      const wallPositions = [
          { x: 0, y: 0, width: 1200, height: blockSize }, // Top wall
          { x: 0, y: 784, width: 1200, height: blockSize }, // Bottom wall
          { x: 0, y: 0, width: blockSize, height: 800 }, // Left wall
          { x: 1184, y: 0, width: blockSize, height: 800 }, // Right wall
      ];

      walls = [];

      wallPositions.forEach(pos => {
          const numBlocks = Math.floor(pos.width / blockSize);
          for (let i = 0; i < numBlocks; i++) {
              const x = pos.x + i * blockSize + (pos.width > pos.height ? blockSize / 2 : 0);
              const y = pos.y + (pos.height > pos.width ? i * blockSize + blockSize / 2 : 0);
              this.add.image(x, y, 'block').setOrigin(0.5, 0.5);
              walls.push({ x: x, y: y, width: blockSize+10, height: blockSize+10 });
          }

          // Para muros verticales, ajustar la posición
          if (pos.width === blockSize) {
              const numBlocksVertical = Math.floor(pos.height / blockSize);
              for (let j = 0; j < numBlocksVertical; j++) {
                  const x = pos.x + blockSize / 2;
                  const y = pos.y + j * blockSize + blockSize / 2;
                  this.add.image(x, y, 'block').setOrigin(0.5, 0.5);
                  walls.push({ x: x, y: y, width: blockSize+10, height: blockSize+10 });
              }
          }
      });

      // 3. Crear obstáculos adicionales
      obstacles = [];
      for (let i = 0; i < 6; i++) {
          const x = Phaser.Math.Between(50, 1150);
          const y = Phaser.Math.Between(50, 750);
          // Visualmente se mantiene en 55x55, pero el área de colisión es un poco mayor
          this.add.image(x, y, 'block').setOrigin(0.5, 0.5).setDisplaySize(55, 55);
          obstacles.push({ x: x, y: y, width: 70, height: 70 }); // Área de colisión ajustada a 60x60
      }

      collisiondetector = new CollisionDetector(walls, obstacles);

      obstacleavoidance = new ObstacleAvoidance(kinematicBird2,initial_target,300,collisiondetector,24,96)

    }
  }
  
  function updateGame1(time, delta) {
    // KinematicArrive

    var frame = delta / 1000;

    var steering = kinematicArrive.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame);
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, 400, frame);

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1);
    wrapAround(kinematicBird2);
  }
  // #################################################################
  function updateGame2(time, delta) {
    //KinematicFlee
    var frame = delta / 1000;

    var steering = Kinematicflee.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame);
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, 400, frame);

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1, true);
    wrapAround(kinematicBird2);
  }
  //###################################################################
  function updateGame3(time, delta) {
    // KinematicWandering
    var frame = delta / 1000;

    var steering = Kinematicwander.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame);
    }
    var maxSpeed = 50;

    if(kinematicBird1.velocity.length()>maxSpeed){
      kinematicBird1.velocity = kinematicBird1.velocity.normalize().scale(maxSpeed);
    }

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;


    wrapAround(kinematicBird1, true);
  }
  //#######################################################################
  function updateGame4(time, delta) {
    // DynamicSeek

    var frame = delta / 1000;

    var steering = dynamicseek.getSteering();

    // explicitTarget = new KinematicSteeringBehaviors(
    //   new Staticc(
    //     kinematicBird2.position.clone(),
    //     kinematicBird2.orientation
    //   ),
    //   kinematicBird2.velocity.clone(),
    //   kinematicBird2.rotation
    // );

    // var steering2 = lwyag.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame,300);
    //  kinematicBird1.update(steering2,frame,300)
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, 400, frame);

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1);
    wrapAround(kinematicBird2);
  }

  function updateGame5(time, delta) {
    //DynamicFlee

    var frame = delta / 1000;

    var steering = dynamicflee.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame,300);
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, frame,400);

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1, true);
    wrapAround(kinematicBird2);
  }
  //##############################################################################
  function updateGame6(time, delta) {
    // DynamicArrive
    var frame = delta / 1000;

    var steering = dynamicarrive.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame,300);
    }

    var maxSpeed = 400;

    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, 500, frame);

    if (kinematicBird2.velocity.length() > maxSpeed) {
      kinematicBird2.velocity = kinematicBird2.velocity.normalize();
      kinematicBird2.velocity = kinematicBird2.velocity.scale(maxSpeed);
    }

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1);
    wrapAround(kinematicBird2, true);
  }
  //######################################################################################

  function updateGame7(time, delta) {
    var frame = delta / 1000;

    var steering = aling.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame, 300);
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, 400, frame);

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;

    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1);
    wrapAround(kinematicBird2, true);
  }

  function updateGame8(time, delta) {
    var frame = delta / 1000;

    var steering = velocitymatching.getSteering();
    if (steering !== undefined) {
      kinematicBird1.update(steering, frame,800);
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      // kinematicBird1.velocity = new Vector(0, 0);
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2,frame,800);

    kinematicBird1.orientation = newOrientation(
      kinematicBird1.orientation,
      kinematicBird1.velocity
    );

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1, true);
    wrapAround(kinematicBird2, true);
  }

  function updateGame9(time, delta) {
    var frame = delta / 1000;

    
    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );

    var steering = face.getSteering();

    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );

    var steering2 = face2.getSteering();

    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );

    var steering3 = face3.getSteering();

    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );

    var steering4 = face4.getSteering();

    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );

    var steering5 = face5.getSteering();
    if (
      steering !== undefined &&
      steering2 !== undefined &&
      steering3 !== undefined &&
      steering4 !== undefined &&
      steering5 !== undefined
    ) {
      kinematicBird1.update(steering, frame,300);
      kinematicBird3.update(steering2, frame,300);
      kinematicBird4.update(steering3, frame,300);
      kinematicBird5.update(steering4, frame,300);
      kinematicBird6.update(steering5, frame,300);
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, 400, frame);

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );


    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird3.x = kinematicBird3.position.x;
    bird3.y = kinematicBird3.position.y;
    bird3.rotation = kinematicBird3.orientation;

    bird4.x = kinematicBird4.position.x;
    bird4.y = kinematicBird4.position.y;
    bird4.rotation = kinematicBird4.orientation;

    bird5.x = kinematicBird5.position.x;
    bird5.y = kinematicBird5.position.y;
    bird5.rotation = kinematicBird5.orientation ;

    bird6.x = kinematicBird6.position.x;
    bird6.y = kinematicBird6.position.y;
    bird6.rotation = kinematicBird6.orientation ;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1);
    wrapAround(kinematicBird2, true);
  }

  function updateGame10(time, delta) {
    // DynamicSeek

    var frame = delta / 1000;

    var steering = pursue.getSteering();

    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );

    var steering2 = evade.getSteering();
    if (steering !== undefined && steering2 !== undefined) {
      kinematicBird1.update(steering, frame,350);
      kinematicBird3.update(steering2, frame,350);
    }

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird2 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird2.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird2.linear = acceleration;

    kinematicBird2.update(steeringBird2, frame,350);

    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );

    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird3.x = kinematicBird3.position.x;
    bird3.y = kinematicBird3.position.y;
    bird3.rotation = kinematicBird3.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1, true);
    wrapAround(kinematicBird2);
    wrapAround(kinematicBird3, true);
  }

  function updateGame11(time, delta) {
    var frame = delta / 1000;

    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
      kinematicBird2.velocity.clone(),
      kinematicBird2.rotation
    );
    var steering = pursue.getSteering();


    explicitTarget = new KinematicSteeringBehaviors(
      new Staticc(kinematicBird1.position.clone(), kinematicBird1.orientation),
      kinematicBird1.velocity.clone(),
      kinematicBird1.rotation
    );

    var steering2 = evade.getSteering();

    if (steering !== undefined && steering2 !== undefined) {
      kinematicBird1.update(steering,350,frame);
      kinematicBird2.update(steering2, 350,frame);
    }


    kinematicBird2.orientation = newOrientation(
      kinematicBird2.orientation,
      kinematicBird2.velocity
    );

    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation;

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation;

    wrapAround(kinematicBird1, true);
    wrapAround(kinematicBird2, false,true);
  }

  function updateGame12(time, delta) {
    // var frame = delta / 1000;

    // explicitTarget = new KinematicSteeringBehaviors(
    //   new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
    //   kinematicBird2.velocity.clone(),
    //   kinematicBird2.rotation
    // );

    // explicitTargetToSeek = new KinematicSteeringBehaviors(
    //   new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
    //   kinematicBird2.velocity.clone(),
    //   kinematicBird2.rotation
    // );

    // var steering = wander.getSteering();
    // if (steering !== undefined) {
    //   kinematicBird2.update(steering, 300, frame);
    // }

    // // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    // let previousKeyX = null; // Guardará la tecla anterior en el eje X
    // let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    // let steeringBird2 = new SteeringOutput();

    // // Manejar entradas de teclado para movimiento lineal
    // let acceleration = new Vector(0, 0); // Aceleración inicial

    // if (cursors.left.isDown) {
    //   if (previousKeyX === "right") {
    //     // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
    //     acceleration.x = 0;
    //   } else {
    //     // Acelerar hacia la izquierda
    //     acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
    //     previousKeyX = "left";
    //   }
    // } else if (cursors.right.isDown) {
    //   if (previousKeyX === "left") {
    //     // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
    //     acceleration.x = 0;
    //   } else {
    //     // Acelerar hacia la derecha
    //     acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
    //     previousKeyX = "right";
    //   }
    // } else {
    //   previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    // }

    // if (cursors.up.isDown) {
    //   if (previousKeyY === "down") {
    //     // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
    //     acceleration.y = 0;
    //   } else {
    //     // Acelerar hacia arriba
    //     acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
    //     previousKeyY = "up";
    //   }
    // } else if (cursors.down.isDown) {
    //   if (previousKeyY === "up") {
    //     // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
    //     acceleration.y = 0;
    //   } else {
    //     // Acelerar hacia abajo
    //     acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
    //     previousKeyY = "down";
    //   }
    // } else {
    //   previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    // }

    // // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    // if (cursors.left.isDown && cursors.right.isDown) {
    //   acceleration.x = 0;
    // }

    // if (cursors.up.isDown && cursors.down.isDown) {
    //   acceleration.y = 0;
    // }

    // // Si no hay teclas presionadas, no hay aceleración lineal
    // if (
    //   !cursors.left.isDown &&
    //   !cursors.right.isDown &&
    //   !cursors.up.isDown &&
    //   !cursors.down.isDown
    // ) {
    //   // Podrías implementar una desaceleración suave aquí si lo deseas
    //   // Por ahora, no aplicamos aceleración
    //   kinematicBird2.velocity = new Vector(0, 0);
    // }

    // // Asignar la aceleración lineal al steering
    // steeringBird2.linear = acceleration;

    // kinematicBird2.update(steeringBird2, 400, frame);

    // explicitTarget = new KinematicSteeringBehaviors(
    //   new Staticc(kinematicBird2.position.clone(), kinematicBird2.orientation),
    //   kinematicBird2.velocity.clone(),
    //   kinematicBird2.rotation
    // );

    // kinematicBird2.orientation = newOrientation(
    //   kinematicBird2.orientation,
    //   kinematicBird2.velocity
    // );

    // bird2.x = kinematicBird2.position.x;
    // bird2.y = kinematicBird2.position.y;
    // bird2.rotation = kinematicBird2.orientation - correctionFactor;

    // wrapAround(kinematicBird2, true);
  }

  function updateGame13(time, delta) {
    var frame = delta / 1000;

  
    var steering1 = separation1.getSteering();
    var steering2 = separation2.getSteering();
    var steering3= separation3.getSteering();
    var steering4= separation4.getSteering();
    var steering5= separation5.getSteering();
    var steering6= separation6.getSteering();
    var steering7= separation7.getSteering();
    var steering8= separation8.getSteering();
    var steering9= separation9.getSteering();
    var steering10= separation10.getSteering();


    var steeringvl1 = vl1.getSteering();
    var steeringvl2 = vl2.getSteering();
    var steeringvl3 = vl3.getSteering();
    var steeringvl4 = vl4.getSteering();
    var steeringvl5 = vl5.getSteering();
    var steeringvl6 = vl6.getSteering();
    var steeringvl7 = vl7.getSteering();
    var steeringvl8 = vl8.getSteering();
    var steeringvl9 = vl9.getSteering();
    var steeringvl10 = vl10.getSteering();

    var steeringArray = [steering1, steering2, steering3,steering4,steering5,steering6,steering7,steering8,steering9,steering10];
    var steeringvlArray = [steeringvl1, steeringvl2, steeringvl3,steeringvl4,steeringvl5,steeringvl6,steeringvl7,steeringvl8,steeringvl9,steeringvl10];

    var array_kinematic = [kinematicBird1,kinematicBird2,kinematicBird3,kinematicBird4,kinematicBird5,kinematicBird6,kinematicBird7,kinematicBird8,kinematicBird9,kinematicBird10];

    array_kinematic.forEach((bird, index) => {
      var steering = steeringArray[index];
      var steeringvl = steeringvlArray[index];
  
      // Generar el steeringtotal para cada bird
      var steeringtotal = new SteeringOutput(
          steering.linear.scale(5).add(steeringvl.linear),
          steering.angular + steeringvl.angular
      );
  
      // Asignar steeringtotal al bird o hacer lo que necesites con él
      bird.update (steeringtotal,frame,300);
  });

   

    // let steeringBird2 = new SteeringOutput(new Vector(0, 0), 0);
    let previousKeyX = null; // Guardará la tecla anterior en el eje X
    let previousKeyY = null; // Guardará la tecla anterior en el eje Y

    let steeringBird11 = new SteeringOutput();

    // Manejar entradas de teclado para movimiento lineal
    let acceleration = new Vector(0, 0); // Aceleración inicial

    if (cursors.left.isDown) {
      if (previousKeyX === "right") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la izquierda
        acceleration.x = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "left";
      }
    } else if (cursors.right.isDown) {
      if (previousKeyX === "left") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento horizontal
        acceleration.x = 0;
      } else {
        // Acelerar hacia la derecha
        acceleration.x = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyX = "right";
      }
    } else {
      previousKeyX = null; // Resetear si no hay teclas presionadas en el eje X
    }

    if (cursors.up.isDown) {
      if (previousKeyY === "down") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia arriba
        acceleration.y = -400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "up";
      }
    } else if (cursors.down.isDown) {
      if (previousKeyY === "up") {
        // Si se presionó la tecla opuesta anteriormente, detener el movimiento vertical
        acceleration.y = 0;
      } else {
        // Acelerar hacia abajo
        acceleration.y = 400; // Valor de aceleración en pixeles por segundo^2 (ajusta según necesites)
        previousKeyY = "down";
      }
    } else {
      previousKeyY = null; // Resetear si no hay teclas presionadas en el eje Y
    }

    // Manejar movimientos adyacentes (teclas opuestas simultáneamente)
    if (cursors.left.isDown && cursors.right.isDown) {
      acceleration.x = 0;
    }

    if (cursors.up.isDown && cursors.down.isDown) {
      acceleration.y = 0;
    }

    // Si no hay teclas presionadas, no hay aceleración lineal
    if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.up.isDown &&
      !cursors.down.isDown
    ) {
      // Podrías implementar una desaceleración suave aquí si lo deseas
      // Por ahora, no aplicamos aceleración
      kinematicBird11.velocity = new Vector(0, 0);
    }

    // Asignar la aceleración lineal al steering
    steeringBird11.linear = acceleration;

    kinematicBird11.update(steeringBird11, frame,300);

    kinematicBird11.orientation = newOrientation(
      kinematicBird11.orientation,
      kinematicBird11.velocity
    );

    bird2.x = kinematicBird2.position.x;
    bird2.y = kinematicBird2.position.y;
    bird2.rotation = kinematicBird2.orientation ;

    bird3.x = kinematicBird3.position.x;
    bird3.y = kinematicBird3.position.y;
    bird3.rotation = kinematicBird3.orientation ;

    bird4.x = kinematicBird4.position.x;
    bird4.y = kinematicBird4.position.y;
    bird4.rotation = kinematicBird4.orientation ;

    bird5.x = kinematicBird5.position.x;
    bird5.y = kinematicBird5.position.y;
    bird5.rotation = kinematicBird5.orientation ;

    bird6.x = kinematicBird6.position.x;
    bird6.y = kinematicBird6.position.y;
    bird6.rotation = kinematicBird6.orientation ;

    bird7.x = kinematicBird7.position.x;
    bird7.y = kinematicBird7.position.y;
    bird7.rotation = kinematicBird7.orientation ;
    
    bird8.x = kinematicBird8.position.x;
    bird8.y = kinematicBird8.position.y;
    bird8.rotation = kinematicBird8.orientation ;

    bird9.x = kinematicBird9.position.x;
    bird9.y = kinematicBird9.position.y;
    bird9.rotation = kinematicBird9.orientation ;

    bird10.x = kinematicBird10.position.x;
    bird10.y = kinematicBird10.position.y;
    bird10.rotation = kinematicBird10.orientation ;
    
    bird11.x = kinematicBird11.position.x;
    bird11.y = kinematicBird11.position.y;
    bird11.rotation = kinematicBird11.orientation ;


    bird1.x = kinematicBird1.position.x;
    bird1.y = kinematicBird1.position.y;
    bird1.rotation = kinematicBird1.orientation ;

    wrapAround(kinematicBird1, true);
    wrapAround(kinematicBird2, true);
    wrapAround(kinematicBird3, true);
    wrapAround(kinematicBird4, true);
    wrapAround(kinematicBird5, true);
    wrapAround(kinematicBird6, true);
    wrapAround(kinematicBird7, true);
    wrapAround(kinematicBird8, true);
    wrapAround(kinematicBird9, true);
    wrapAround(kinematicBird10, true);
    wrapAround(kinematicBird11, true);
  }

  function updateGame14(time, delta){

    const frame = delta / 1000;

        // Obtener la salida de steering
    var steering = obstacleavoidance.getSteering();

    if (steering !== undefined ) {
      kinematicBird2.update(steering, frame,350);
    }

    if(kinematicBird2.velocity.length()<20){
      kinematicBird2.velocity= kinematicBird2.velocity.normalize().scale(100);
    }

      bird2.x = kinematicBird2.position.x;
      bird2.y = kinematicBird2.position.y;
      bird2.rotation = kinematicBird2.orientation;
  }



  function returnToMenu() {
    // Destruir la instancia del juego
    game.destroy(true);

    // Mostrar el menú nuevamente
    document.getElementById("menu").style.display = "block";
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


