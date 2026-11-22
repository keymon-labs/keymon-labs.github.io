// eggBirds.js — Bird type definitions for Egg Catcher

const BIRD_TYPES = {
  sparrow: {
    bodyWidth: 14, bodyHeight: 10,
    bodyColor: '#8B7355', headColor: '#8B6914', bellyColor: '#D2B48C',
    wingColor: '#6B5B3A', tailColor: '#5C4A2A', beakColor: '#DAA520',
    speed: [80, 120], eggRate: [1500, 2500]
  },
  robin: {
    bodyWidth: 15, bodyHeight: 11,
    bodyColor: '#696969', headColor: '#555555', bellyColor: '#E5533E',
    wingColor: '#555555', tailColor: '#444444', beakColor: '#DAA520',
    speed: [70, 110], eggRate: [1800, 3000]
  },
  bluebird: {
    bodyWidth: 13, bodyHeight: 9,
    bodyColor: '#4169E1', headColor: '#3157D1', bellyColor: '#87CEEB',
    wingColor: '#3157D1', tailColor: '#2847C1', beakColor: '#555555',
    speed: [90, 140], eggRate: [1200, 2200]
  },
  cardinal: {
    bodyWidth: 16, bodyHeight: 12,
    bodyColor: '#CC2222', headColor: '#BB1111', bellyColor: '#FF6666',
    wingColor: '#991111', tailColor: '#881111', beakColor: '#FF8C00',
    speed: [60, 100], eggRate: [2000, 3500]
  },
  owl: {
    bodyWidth: 20, bodyHeight: 16,
    bodyColor: '#8B7765', headColor: '#7B6755', bellyColor: '#C4A882',
    wingColor: '#6B5745', tailColor: '#5B4735', beakColor: '#DAA520',
    speed: [40, 70], eggRate: [3000, 5000]
  }
};

const BIRD_TYPE_NAMES = Object.keys(BIRD_TYPES);
