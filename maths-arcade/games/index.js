// All mini games, in menu order. To add one: create games/<id>/index.js with
// the same shape as catapult/index.js and list it here.
import catapult from './catapult/index.js';

export const games = [catapult];
export const findGame = (id) => games.find((g) => g.id === id);
