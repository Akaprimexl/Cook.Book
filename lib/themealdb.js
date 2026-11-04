const API_ROOT = 'https://www.themealdb.com/api/json/v1/1'

async function apiGet(endpoint) {
  const response = await fetch(API_ROOT + endpoint, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error('TheMealDB API cavab vermədi: ' + response.status)
  }

  return response.json()
}

export async function searchMeals(query) {
  const endpoint = query
    ? '/search.php?s=' + encodeURIComponent(query)
    : '/search.php?f=c'
  const data = await apiGet(endpoint)
  return data.meals || []
}

export async function getMeal(id) {
  const data = await apiGet('/lookup.php?i=' + encodeURIComponent(id))
  return data.meals?.[0] || null
}

export async function getCategories() {
  const data = await apiGet('/categories.php')
  return data.categories || []
}

export async function getMealsByCategory(category) {
  const data = await apiGet('/filter.php?c=' + encodeURIComponent(category))
  return data.meals || []
}

export function toRecipe(meal) {
  const ingredients = []

  for (let number = 1; number <= 20; number += 1) {
    const name = meal['strIngredient' + number]?.trim()
    const measure = meal['strMeasure' + number]?.trim()
    if (name) ingredients.push({ ad: name, miqdar: null, olcu: measure || '' })
  }

  const steps = (meal.strInstructions || '')
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean)

  return {
    id: meal.idMeal,
    ad: meal.strMeal,
    kateqoriya: meal.strCategory || 'Resept',
    olke: meal.strArea || 'Məlumat yoxdur',
    tesvir: meal.strTags || 'TheMealDB resepti',
    sekil: meal.strMealThumb,
    inqrediyentler: ingredients,
    addimlar: steps.length ? steps : ['Hazırlanma qaydası mövcud deyil.'],
  }
}

export function toRecipeCard(meal) {
  return {
    id: meal.idMeal,
    ad: meal.strMeal,
    kateqoriya: meal.strCategory || 'Resept',
    tesvir: meal.strArea || 'TheMealDB resepti',
    sekil: meal.strMealThumb,
    muddet: 'TheMealDB',
  }
}
