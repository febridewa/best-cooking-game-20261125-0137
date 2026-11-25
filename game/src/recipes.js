// Ingredients and recipes: the whole menu of Sizzle & Sage.
//
// Every dish starts from a bun and stacks prepared ingredients. Raw items
// come from the pantry; tomato, lettuce and onion must be chopped on the
// board, a patty must be grilled, onion rings must be fried. Cheese needs
// no prep, so it is the fast filler when the board is busy. Recipes combine
// in different ways on purpose: the same six preps build six different
// tickets, so a good cook preps what the next two tickets share.

export const INGREDIENTS = {
  bun: { id: 'bun', name: 'Bun', needs: 'none', color: '#e8b96a', dark: '#b98a3e' },
  patty: { id: 'patty', name: 'Patty', needs: 'grill', color: '#8a5a3b', dark: '#5f3a24' },
  grilledPatty: { id: 'grilledPatty', name: 'Grilled Patty', needs: 'none', color: '#7a4a2e', dark: '#54301c' },
  tomato: { id: 'tomato', name: 'Tomato', needs: 'chop', color: '#e04a3a', dark: '#a82e22' },
  choppedTomato: { id: 'choppedTomato', name: 'Tomato Slices', needs: 'none', color: '#ef6a55', dark: '#c23a28' },
  lettuce: { id: 'lettuce', name: 'Lettuce', needs: 'chop', color: '#69b455', dark: '#3f7d31' },
  choppedLettuce: { id: 'choppedLettuce', name: 'Shredded Lettuce', needs: 'none', color: '#8fce6e', dark: '#5a9a42' },
  cheese: { id: 'cheese', name: 'Cheese', needs: 'none', color: '#f6c945', dark: '#cf9a1d' },
  onion: { id: 'onion', name: 'Onion', needs: 'chop', color: '#c9a0dc', dark: '#8a68a8' },
  choppedOnion: { id: 'choppedOnion', name: 'Diced Onion', needs: 'none', color: '#d9b8ec', dark: '#9a76b8' },
  onionRings: { id: 'onionRings', name: 'Onion Rings', needs: 'none', color: '#d99a4e', dark: '#a86f2c' },
  burnt: { id: 'burnt', name: 'Burnt!', needs: 'none', color: '#3a3230', dark: '#1c1715' },
};

/** Pantry bins, in the order they hang on the left wall. */
export const PANTRY = ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'onion'];

/** What a prep station turns an ingredient into. */
export const PREP_RESULTS = {
  chop: { tomato: 'choppedTomato', lettuce: 'choppedLettuce', onion: 'choppedOnion' },
  grill: { patty: 'grilledPatty' },
  fry: { onion: 'onionRings' },
};

export const RECIPES = [
  {
    id: 'ember-classic',
    name: 'Ember Classic',
    needs: ['bun', 'grilledPatty', 'choppedLettuce', 'choppedTomato'],
    price: 14,
    blurb: 'The house favourite',
  },
  {
    id: 'sage-melt',
    name: 'Sage Melt',
    needs: ['bun', 'grilledPatty', 'cheese', 'cheese'],
    price: 16,
    blurb: 'Double cheese, no fuss',
  },
  {
    id: 'garden-stack',
    name: 'Garden Stack',
    needs: ['bun', 'choppedLettuce', 'choppedTomato', 'cheese'],
    price: 12,
    blurb: 'No grill, all fresh',
  },
  {
    id: 'crunch-ring',
    name: 'Crunch Ring',
    needs: ['bun', 'grilledPatty', 'onionRings', 'choppedTomato'],
    price: 18,
    blurb: 'Crispy onion rings',
  },
  {
    id: 'double-ember',
    name: 'Double Ember',
    needs: ['bun', 'grilledPatty', 'grilledPatty', 'cheese'],
    price: 20,
    blurb: 'Two patties, one tower',
  },
  {
    id: 'green-sage',
    name: 'Green Sage',
    needs: ['bun', 'choppedLettuce', 'choppedTomato', 'choppedOnion', 'cheese'],
    price: 15,
    blurb: 'Five layers of green',
  },
];

/** Count how many of each ingredient a list holds. */
export function countIngredients(list) {
  const counts = {};
  for (const item of list) counts[item] = (counts[item] ?? 0) + 1;
  return counts;
}

/** True when `built` holds exactly the ingredients a recipe needs. */
export function matchesRecipe(built, recipe) {
  const have = countIngredients(built);
  const want = countIngredients(recipe.needs);
  const keys = new Set([...Object.keys(have), ...Object.keys(want)]);
  for (const key of keys) if ((have[key] ?? 0) !== (want[key] ?? 0)) return false;
  return true;
}

/** The recipe a built plate matches, or null when it matches none. */
export function recipeForPlate(built) {
  for (const recipe of RECIPES) if (matchesRecipe(built, recipe)) return recipe;
  return null;
}

/** Short label for an ingredient, used on tickets and the carried item. */
export function shortName(id) {
  const names = {
    bun: 'Bun',
    patty: 'Patty',
    grilledPatty: 'Grill Patty',
    tomato: 'Tomato',
    choppedTomato: 'Tomato',
    lettuce: 'Lettuce',
    choppedLettuce: 'Lettuce',
    cheese: 'Cheese',
    onion: 'Onion',
    choppedOnion: 'Onion',
    onionRings: 'Onion Rings',
    burnt: 'Burnt!',
  };
  return names[id] ?? id;
}
