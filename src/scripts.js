import './styles.css';
import {apiCalls} from './apiCalls';
import User from './classes/User'
import RecipeRepository from './classes/RecipeRepository';
import { use } from 'chai';

const {fetchData} = apiCalls;
const {addToPantry} = apiCalls;
//console.log({addToPantry});

const recipeDisplay = document.querySelector('#recipeDisplay');
const recipeHeading = document.querySelector('#recipeHeading');
const homeButton = document.querySelector('#homeButton');
const favoriteButton = document.querySelector('#favoriteButton');
const cookRecipeButton = document.querySelector('#recipeToCook');
const addToPantryButton = document.querySelector('#addToPantryButton');
const pantryButton = document.querySelector('#pantryButton');
const recipeNameInput = document.querySelector('#recipeNameInput');
const recipeTagInput = document.querySelector('#recipeTagInput');
const filterForm = document.querySelector('#filterForm');
const searchForm = document.querySelector('#searchForm');
const filterFavoriteForm = document.querySelector('#filterFavoriteForm');
const recipeFavoriteTagInput = document.querySelector('#recipeFavoriteTagInput');
const favSearchForm = document.querySelector('#favSearchForm');
const recipeFavNameInput = document.querySelector('#favRecipeNameInput');
const favSearchLabel = document.querySelector('#favSearchLabel');
const filterFavoriteLabel = document.querySelector('#filterFavoriteLabel');
const searchLabel = document.querySelector('#searchLabel');
const filterLabel = document.querySelector('#filterLabel');


let user;
let ingredientsInfo;
let userInfo;
let recipeRepository;

fetchData().then(responses => {

    ingredientsInfo = responses[1]
    userInfo = responses[2]
    recipeRepository = new RecipeRepository(responses[0])

    recipeRepository.listRecipes();
    user = createUser();

    displayRecipeList();

}).catch(err => recipeDisplay.innerHTML = (`<h1>${err}</h1>`));



recipeDisplay.addEventListener('click', recipeDisplayHandler);
homeButton.addEventListener('click', goHome);
filterForm.addEventListener('submit', filterRecipeTag);
searchForm.addEventListener('submit', searchRecipeName);
favoriteButton.addEventListener('click', showFavorites);
//cookRecipeButton.addEventListener('click', canCookRecipe);
pantryButton.addEventListener('click', showMyPantry);
filterFavoriteForm.addEventListener('submit', filterFavoriteRecipesByTag);
favSearchForm.addEventListener('submit', searchFavRecipeListByName);

function hideOn(elements) {
    elements.forEach((element) => {
        element.classList.add('hidden')
    })
}

function hideOff(elements) {
    elements.forEach((element) => {
        element.classList.remove('hidden')
 })
}


function createUser() {
    const randomNumber = Math.floor(Math.random() * userInfo.length);
    const user = userInfo[randomNumber];
    return new User(user);
}

function showMyPantry() {
    hideOff([homeButton]);
    hideOn([searchForm, filterForm, filterFavoriteForm, favSearchForm, favSearchLabel, filterFavoriteLabel,  searchLabel, filterLabel, pantryButton]);
    const pantryWithNames = findExistingPantryIngredients();
    recipeHeading.innerText = 'My Pantry';
    recipeDisplay.innerHTML = ""
    pantryWithNames.forEach((ingredient) => {
    recipeDisplay.innerHTML += (`
        <div class="ingredient-card" id=${ingredient.id}>
            <p>Name: ${ingredient.name}</p>
            <p>Amount: ${ingredient.amount}</p>
        </div>
      `)
    }
    )
}

function findExistingPantryIngredients() {
    const pantryIngredients = user.pantry.ingredients.map(ingredient => {
        ingredientsInfo.forEach(ingredientInfo => {
            if (ingredientInfo.id === ingredient.ingredient) {
                ingredientInfo.amount = ingredient.amount
                ingredient = ingredientInfo;
            }
        });

        return ingredient;
    });

    return pantryIngredients;
}

function addIngredientsToPantry(event) {
  //const newIngredient = {};
  const recipeId = parseInt(event.target.getAttribute('data-pantryIngredient'))
  const userId = user.id
//   console.log(event.target.getAttribute('data-pantryIngredient'), "1")
//   console.log(recipeId, "2")
  // Use the event to get the data attribute off of the addToPantry button and store it in a variable
  const selectedRecipe = recipeRepository.recipeList.find(recipe => recipe.id === recipeId);
  const pantryIngredients = user.pantry.getNeededIngredients(selectedRecipe)
  // we need to iterate thru pantryIngredients and find the id and the amount
  const pantry = pantryIngredients.map((ingredient) => {
    return {ingredientId: ingredient.id, ingredientAmount: ingredient.quantity.amount}
})
// console.log(pantry, "3")
const postObj = pantry.map(ingredientIdAndAmount => {
    return makePostObj(userId, ingredientIdAndAmount.ingredientId, ingredientIdAndAmount.ingredientAmount)
});
console.log(postObj)
console.log(user.pantry, "before")
postObj.forEach(obj => addToPantry(obj))
console.log(user.pantry, "after")
document.querySelector("#addToPantry").classList.add("hidden")

}


  // Now you should have a recipe to pass into getNeededIngredients()
  //console.log the recipe and think about how you will access the data you need


  // Call the makePostObj first and store it in a variable
  // Pass that variable into the method that makes the post request (addToPantry())
//   console.log(user.pantry.getNeededIngredients());

// };

//Iterate over the user class and set the function parameters as keys in a new object
function makePostObj(userID, ingredientID, ingredientMod) {
  return {
    "userID": userID,
    "ingredientID": ingredientID,
    "ingredientModification": ingredientMod
  }
};

function recipeDisplayHandler(event) {
    if (event.target.getAttribute("data-recipeId")) {
        showRecipeInstructions(event);
    } else if (event.target.getAttribute("data-favoriteRecipe") && event.target.innerHTML === 'Favorite') {
        addToFavorite(event);
    } else if (parseInt(event.target.getAttribute('data-favoriteRecipe')) && event.target.innerHTML === 'Remove') {
        removeFromFavorite(event);
        showFavorites();
    } else if (event.target.getAttribute("data-pantryIngredient")) {
        addIngredientsToPantry(event);
        //Add else if statement that checks if the addToPantry buttons has the data attribute that I assigned to it.
    }
}

function removeFromFavorite(event) {
    const recipeId = parseInt(event.target.getAttribute('data-favoriteRecipe'));
    user.removeRecipesToCook(recipeId);
}

function addToFavorite(event) {
    event.target.classList.add('hidden');
    const recipeId = parseInt(event.target.getAttribute('data-favoriteRecipe'))
    const selectedRecipe = recipeRepository.recipeList.find(recipe => recipe.id === recipeId);
    user.addRecipesToCook(selectedRecipe);

    if (event.target.getAttribute("data-instructionDisplay")) {
        showIngredientsNeeded(selectedRecipe);
    }
}

function showIngredientsNeeded(selectedRecipe) {
    if (user.recipesToCook.includes(selectedRecipe)) {
            const answer = user.pantry.checkIfCanMakeRecipe(selectedRecipe);
            if (answer) {
                document.querySelector("#pantryFeedback").innerHTML += `<p> You have enough ingredients!</p>`;
            } else {
                const usersNeededIngredients = user.pantry.getNeededIngredients(selectedRecipe);
                const neededIngredients = usersNeededIngredients.map((pantryIngredient) => {
                    ingredientsInfo.forEach((ingredient) => {
                        if (pantryIngredient.id === ingredient.id) {

                            pantryIngredient.name = ingredient.name;

                        }
                    })
                return pantryIngredient;
            })
                document.getElementById(selectedRecipe.id).innerHTML += `<button class="favorite-button" id="addToPantry" data-pantryIngredient=${selectedRecipe.id}>Add to Pantry</button>`
            document.querySelector("#pantryFeedback").innerHTML += `<p class="ingredients-feedback"> You don't have enough ingredients! This is what you need. Read below:</p>
                                                                        <ul id="neededIngredients"></ul>`

            neededIngredients.forEach((neededIngredient) => {
                document.querySelector("#neededIngredients").innerHTML +=
                    `<li>${neededIngredient.name}, ${neededIngredient.quantity.amount} ${neededIngredient.quantity.unit}</li>`
            })
        }
    }
}

function showFavorites() {
    hideOn([searchForm, filterForm, favoriteButton, searchLabel, filterLabel]);
    hideOff([filterFavoriteForm, favSearchForm, homeButton, favSearchLabel, filterFavoriteLabel]);


    homeButton.classList.remove('hidden');
    homeButton.classList.add('favorite');
    recipeHeading.innerText = 'Favorite Recipes';
    recipeDisplay.innerHTML = "";
    user.recipesToCook.forEach((recipe) => {
        recipeDisplay.innerHTML += (`
            <div class="recipe-image-wrapper" id=${recipe.id}>
            <button class="recipe-img-btn">
                <img class="recipe-image" data-recipeId=${recipe.id} src=${recipe.image} alt="View ${recipe.name} instructions">
            </button>
                <p class="recipe-name">${recipe.name}</p>
                <button class="favorite-button" data-favoriteRecipe=${recipe.id}>Remove</button>
            </div>
        `)
    });
};

function displayRecipeList() {
    hideOff([searchForm, filterForm, favoriteButton, searchLabel, filterLabel]);
    hideOn([homeButton, filterFavoriteForm, favSearchForm, favSearchLabel, filterFavoriteLabel]);


    recipeDisplay.innerHTML = "";
    recipeRepository.recipeList.forEach((recipe) => {
    recipeDisplay.innerHTML += (`
        <div class="recipe-image-wrapper" id=${recipe.id}>
            <button class="recipe-img-btn">
                <img class="recipe-image" data-recipeId=${recipe.id} src=${recipe.image} alt="View ${recipe.name} instructions">
            </button>
            <p class="recipe-name">${recipe.name}</p>
        </div>
      `)

      if (!user.recipesToCook.includes(recipe)) {
            document.getElementById(recipe.id).innerHTML += `<button class="favorite-button" data-favoriteRecipe=${recipe.id}>Favorite</button>`;
        }

   });
};

function goHome() {
    hideOn([homeButton]);

    recipeHeading.innerText = 'All Recipes';
    recipeDisplay.innerHTML = "";

    displayRecipeList();

}

function showRecipeInstructions(event) {
    hideOn([searchForm, filterForm, filterFavoriteForm, favSearchForm, favSearchLabel, filterFavoriteLabel,  searchLabel, filterLabel]);
    hideOff([favoriteButton, homeButton]);


    const recipeId = parseInt(event.target.getAttribute("data-recipeId"));
    const selectedRecipe = recipeRepository.recipeList.find(recipe => recipe.id === recipeId);

    selectedRecipe.buildIngredientsNeeded(ingredientsInfo);

    const totalCost = selectedRecipe.getTotalCost();

    recipeDisplay.innerHTML = "";
    recipeHeading.innerText = `${selectedRecipe.name}`;
    recipeDisplay.innerHTML = (`
        <div class="selected-recipe-display">
        <img class="selected-recipe-image" src=${selectedRecipe.image} alt=${selectedRecipe.name}>
        <section class="pantry-feedback" id="pantryFeedback"></section>
            <div id=${selectedRecipe.id}></div>
            <div class="instruction-design-div">
                <div class="instructions-display">
                <ol id="recipeInstructions"></ol>
            </div>
            <div class="ingredients-design-div">
                <h3 class="ingredients">Ingredients</h3>
                <ul class="ingredients-list" id="ingredientsList"></ul>
                <p class="total">Total Cost: ${totalCost}</p>
            </div>
            </div>
        </div>
    `);

    if (!user.recipesToCook.includes(selectedRecipe)) {
        document.getElementById(selectedRecipe.id).innerHTML += `<button class="favorite-button" data-favoriteRecipe=${selectedRecipe.id} data-instructionDisplay="instructionDisplay">Favorite</button>`
    }

    if (user.recipesToCook.includes(selectedRecipe)) {
        showIngredientsNeeded(selectedRecipe);
          //Add Pantry button here with a data attribute that has ${selectedRecipe.id} as value.
          //
    }


    selectedRecipe.instructions.forEach((instruction) => {
        document.querySelector("#recipeInstructions").innerHTML += (`
            <li class="instructions">${instruction.instruction}</li>
        `);
    });

    selectedRecipe.ingredientsNeeded.forEach((ingredient) => {
        document.querySelector("#ingredientsList").innerHTML += (`
            <li class="ingredient">${ingredient.name}</li>
        `);
    });
};

function filterRecipeTag(event) {
    event.preventDefault();

    hideOff([homeButton]);

    const inputValue = recipeTagInput.value.toLowerCase();
    const requestedRecipes = recipeRepository.findRecipeByTag(inputValue);

    recipeHeading.innerText = 'Filtered Recipes by Tag';
    recipeDisplay.innerHTML = "";

    if (requestedRecipes === `Sorry, no recipe with ${inputValue}.`) {
        return recipeHeading.innerText = requestedRecipes;
    }

    requestedRecipes.forEach((recipe) => {
    recipeDisplay.innerHTML += (`
        <div class="recipe-image-wrapper">
          <img class="recipe-image" data-recipeId=${recipe.id} data-recipeDisplay="filtered" src=${recipe.image} alt=${recipe.name}>
          <p class="recipe-name">${recipe.name}</p>
          <button class="favorite-button" data-favoriteRecipe=${recipe.id}>Favorite</button>
        </div>
      `)
   });
}

function searchRecipeName(event) {
    event.preventDefault();

    hideOff([homeButton]);

    const inputValue = recipeNameInput.value.split(' ').map(word => {
    return word.split('').map((letter, index) => {
        if (!index) {
            letter = letter.toUpperCase()
        } else {
            letter = letter.toLowerCase()
        }

        return letter
    }).join('');

   }).join(' ');

    const requestedRecipes = recipeRepository.findRecipeByName(inputValue);

    recipeHeading.innerText = 'Filtered Recipes by Name';
    recipeDisplay.innerHTML = "";

    if (requestedRecipes === `Sorry, no recipe named ${inputValue}.`) {
        return recipeHeading.innerText = requestedRecipes;
    }

    requestedRecipes.forEach((recipe) => {
    recipeDisplay.innerHTML += (`
        <div class="recipe-image-wrapper">
          <img class="recipe-image" data-recipeId=${recipe.id} data-recipeDisplay="filtered" src=${recipe.image} alt=${recipe.name}>
          <p class="recipe-name">${recipe.name}</p>
          <button class="favorite-button" data-favoriteRecipe=${recipe.id}>Favorite</button>
        </div>
      `)
   });
 }

 function filterFavoriteRecipesByTag(event) {
    event.preventDefault();

    hideOff([homeButton]);

    const inputValue = recipeFavoriteTagInput.value.toLowerCase();
    const requestedRecipes = user.filterRecipesToCookByTag(inputValue);

    recipeHeading.innerText = 'Filtered Favorite Recipes by Tag';
    recipeDisplay.innerHTML = "";

    if (requestedRecipes === `Sorry, no recipe with ${inputValue}.`) {
        return recipeHeading.innerText = requestedRecipes;
    }

    requestedRecipes.forEach((recipe) => {
    recipeDisplay.innerHTML += (`
        <div class="recipe-image-wrapper">
            <img class="recipe-image" data-recipeId=${recipe.id} data-recipeDisplay="filtered" src=${recipe.image} alt=${recipe.name}>
            <p class="recipe-name">${recipe.name}</p>
        </div>
      `)
   });
 }

 function searchFavRecipeListByName(event) {
   event.preventDefault();

   hideOff([homeButton]);

   const inputValue = recipeFavNameInput.value.split(' ').map(word => {
    return word.split('').map((letter, index) => {
        if (!index) {
            letter = letter.toUpperCase()
        } else {
            letter = letter.toLowerCase()
        }

        return letter
    }).join('');

   }).join(' ');

   const requestedRecipes = user.filterRecipesToCookByName(inputValue);

   recipeHeading.innerText = 'Filtered Favorite Recipes by Name';
   recipeDisplay.innerHTML = "";

   if (requestedRecipes === `Sorry, no recipe named ${inputValue}.`) {
       return recipeHeading.innerText = requestedRecipes;
   }

   requestedRecipes.forEach((recipe) => {
   recipeDisplay.innerHTML += (`
       <div class="recipe-image-wrapper">
            <img class="recipe-image" data-recipeId=${recipe.id} data-recipeDisplay="filtered" src=${recipe.image} alt=${recipe.name}>
            <p class="recipe-name">${recipe.name}</p>
       </div>
     `)
  });
 }
