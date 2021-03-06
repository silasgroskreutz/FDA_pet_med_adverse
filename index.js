'use strict';

// Defining my API key along with the beginning of the FDA API URL
const apiKey = '67Bd4ck0ehZCUIk0pgXXpiK3xP2liXNnyruiboJm'; 
const searchURL = `https://api.fda.gov/animalandveterinary/event.json`;

//This is to use Wikipedia for extract information
function getWiki(searchTerm) {
  let url = `https://en.wikipedia.org/w/api.php`;
  
  let params = {
      "action": "query",
      "format": "json",
      "prop": "extracts",
      "titles": searchTerm,
      "exintro": 1
  };

  //This function is from wikimedia page on how to search their API
  url = url + "?origin=*";
  Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];})

  //This is to fetch from the Wikipedia extracts page
  fetch(url)
    .then(function(response){return response.json();})
    .then(function(response) {
      // need to set this to grab the page number to get to extract, as it is dynamic
        let wikiPage = Object.keys(response.query.pages);
        $('#wikipediaInfo').empty();
        $("#wikipediaInfo").append(response["query"]["pages"][wikiPage]["extract"]);
        $("#wikipediaInfo").css("background-color", "#f5c256");
    })
    .catch(function(error){console.log(error);});
  }


//This function is to take the take the FDA search terms and change them to a URL and combine them
function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

//This takes in the query from watchForm
//FDA API is frustrating as it will only take a single argument to search with along with max results
function getEvents(searchTerm, maxResults) {
    //This is where the API Key search and limit are mapped
    const params = {
      api_key: apiKey,
      search: searchTerm,
      limit: maxResults
    };

    const queryString = formatQueryParams(params)
    //This is where everything is concatinated to create the search url
    const url = searchURL + '?' + queryString;

    // to grab the URL along with a error catching
    fetch(url)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then(responseJson => displayResults(responseJson))
      .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
        $('#results').addClass('hidden');
        $('#wikipediaInfo').addClass('hidden');
        $('#results-list').empty();
      });
  }

  function displayResults(responseJson) {
    // if there are previous results, remove them
    $('#results-list').empty();
    $('#js-error-message').empty();
    // iterate through the items array and add them to the results table. Using nested for loops because reported animal may have been on multiple medications
    // Also, using these results fields; advised by Vet Tech that is what they generally look for.
    for (let i = 0; i < responseJson.results.length; i++){
      // this is to pull out the report date from JSON and re-slice to display as user friendly
      let reportDate = `${responseJson.results[i].original_receive_date}`;
      let readerReportDate = reportDate.slice(4,6) + "-" + reportDate.slice(6,8) + "-" + reportDate.slice(0,4) ;
      
      // This is where the results are added to the page
      $('#results-list').append(
        `
        <tr>
          <td class="field" colspan="2">Report Received Date:</td>
          <td>${readerReportDate}</td>
        </tr>
        <tr>
          <td class="field" colspan="2">Patient Disposition</td>
          <tr></tr>
          <td class="field">Species:</td> <td>${responseJson.results[i].animal.species}</td>
          <td class="field">Breed:</td> <td>${responseJson.results[i].animal.breed.breed_component}</td>
          <td class="field">Gender:</td> <td>${responseJson.results[i].animal.gender}</td>
          <td class="field">Age (years):</td> <td>${responseJson.results[i].animal.age.min}</td>
          <td class="field">Weight (kg):</td> <td>${responseJson.results[i].animal.weight.min}</td>
        </tr>
        `
        );
      $('#results-list').append(`<tr><td class="field" colspan="4">Medications used at time of report:<td></tr>`);

      for (let j = 0; j < responseJson.results[i].drug.length; j++) {
        for (let k = 0; k < responseJson.results[i].drug[j].active_ingredients.length; k++) {
          $('#results-list').append(
           `<td>${responseJson.results[i].drug[j].active_ingredients[k].name} ${responseJson.results[i].drug[j].active_ingredients[k].dose.numerator} mg</td>`
          )};
            };

      $('#results-list').append(`<tr><td class="field">Reactions:</td>`);      
        
      for (let l = 0; l < responseJson.results[i].reaction.length; l++) {
        $('#results-list').append(
          `<td>${responseJson.results[i].reaction[l].veddra_term_name}</td>`)
            };

        $('#results-list').append(
        `
        <tr>
          <td class="field">Results:</td>
          <td>${responseJson.results[i].outcome[0].medical_status}</td> 
        </tr>
        <tr class="extra_row">
          <td>###############</td>
        </tr>
        `
        )};
    //display the results section
    $('#wikipediaInfo').removeClass('hidden');  
    $('#results').removeClass('hidden');
  };

//This function stops default form behavior and takes in the user search
function watchForm() {
    $('form').submit(event => {
      event.preventDefault();
      const searchTerm = $('#js-drug-active-ingred').val();
      const maxResults = $('#js-max-results').val();
      getEvents(searchTerm, maxResults);
      getWiki(searchTerm);
    });
  }
  
  //jquery to run the JS (did you remember to link to Jquery?)
  $(watchForm);