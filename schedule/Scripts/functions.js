
function handleParsedData(results, index, e, csvDataDiv, hiddenDiv, classroomsInput) {
  let headersMatch = false;
  console.log(dictionary)
  if(classroomsInput){
    const dataArray = [
      'Edifício', 'Nome sala', 'Capacidade Normal', 'Capacidade Exame', 'Nº características',
      'Anfiteatro aulas', 'Apoio técnico eventos', 'Arq 1', 'Arq 2', 'Arq 3', 'Arq 4', 'Arq 5',
      'Arq 6', 'Arq 9', 'BYOD (Bring Your Own Device)', 'Focus Group', 'Horário sala visível portal público',
      'Laboratório de Arquitectura de Computadores I', 'Laboratório de Arquitectura de Computadores II',
      'Laboratório de Bases de Engenharia', 'Laboratório de Electrónica', 'Laboratório de Informática',
      'Laboratório de Jornalismo', 'Laboratório de Redes de Computadores I', 'Laboratório de Redes de Computadores II',
      'Laboratório de Telecomunicações', 'Sala Aulas Mestrado', 'Sala Aulas Mestrado Plus', 'Sala NEE',
      'Sala Provas', 'Sala Reunião', 'Sala de Arquitectura', 'Sala de Aulas normal', 'videoconferencia', 'Átrio'
    ];
    headersMatch = dataArray.every((header) => results.meta.fields.includes(header.trim()));
  }
  else if(Object.keys(dictionary).length === 0 && !classroomsInput){
    headersMatch = defaultHeadersArray.every((header) => results.meta.fields.includes(header.trim()));
  } else {
    headersMatch = Object.values(dictionary).every((header) => results.meta.fields.includes(header.trim()));
    console.log(Object.values(dictionary))
    console.log(results.meta.fields)
    console.log(headersMatch)
  }
  console.log(headersMatch)

  const dateFormatsMatch = dateColumns.split(";").every((column) =>
    results.meta.fields.includes(column) &&
    results.data.every(row =>  (moment(row[column], dateFormat, true).isValid() || row[column]=== '') )   //every moment(row[column], dateFormat, true).isValid()
  );

  const timeFormatsMatch = hourColumns.split(";").every((column) =>
    results.meta.fields.includes(column) &&
    results.data.every(row => (moment(row[column], hourFormat, true).isValid() || row[column]=== '')) //every moment(row[column], hourFormat, true).isValid()
  );

  if ((headersMatch && dateFormatsMatch && timeFormatsMatch) || (headersMatch && classroomsInput)) {
    if (hiddenDiv.style.display === "none"){
      hiddenDiv.style.display = "block"
    }
    const table = document.createElement("div");
    table.setAttribute("id", "csvTable" + index);
    csvDataDiv.appendChild(table);
    if (!classroomsInput){
      new Tabulator("#csvTable" + index, {
        data: results.data,
        layout: "fitData",
        autoColumns: true,
        pagination: "local",
        paginationSize: 7,
      });
    }

  } else {
    if(hiddenDiv.style.display === "block" && classroomsInput){
      hiddenDiv.style.display = "none"
    }
    e.target.value = "";
    if(!headersMatch){
      alert("Os cabeçalhos das configurações não correspondem aos do Ficheiro. Certifique-se de que o cabeçalho e o delimitador estão corretos. A tabela anterior será eliminada");
    } else if(!dateFormatsMatch){
      alert("O formato da data das configurações não corresponde ao encontrado no Ficheiro. Insira as alterações necessárias. A tabela anterior será eliminada");
    } else if(!timeFormatsMatch){
      alert("O formato de hora das configurações não corresponde ao encontrado no Ficheiro. Insira as alterações necessárias. A tabela anterior será eliminada");
    }
  }
};

function parseURLs(urls, e, csvDataDiv, hiddenDiv) {
  csvDataDiv.innerHTML = ""; // Clear previous data

  for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      Papa.parse(url, {
      download: true,
      delimiter: csvSeparator,
      header: true,
      complete: function (results) {
          handleParsedData(results, i, e, csvDataDiv, hiddenDiv, false);
          evaluateCriteriums(results)
      }
    });
  }
  saveSettings()
};

function saveSettings(){
  let settings = { "csvSeparator": csvSeparator, "dynamicCriterium": dynamicCriterium, "hourFormat": hourFormat, "dateFormat": dateFormat, "dateColumns": dateColumns, "hourColumns": hourColumns, "dictionary": dictionary};
  localStorage.setItem('executionData', JSON.stringify(settings)); 
}

function handleSwitch(csvFileInput, csvUrlInput) {
  if(toggleSwitch.checked){
    csvFileInput.style.display = "none"
    csvUrlInput.style.display = "block"
  } else{
    csvFileInput.style.display = "block"
    csvUrlInput.style.display = "none"
  }
}

function addNewInput(className, placeholderText, containerId) {
  const inputs = document.querySelectorAll(`.${className}`);
  const lastInput = inputs[inputs.length - 1];

  if (lastInput && event.target === lastInput && lastInput.value.trim() !== '') {
    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.classList.add(className);
    newInput.placeholder = placeholderText;
    document.getElementById(containerId).appendChild(newInput);
  }
}

function handleInputChange(elementId, variableToUpdate) {
  const element = document.getElementById(elementId);
  if (element && element.value !== "") {
    window[variableToUpdate] = element.value;
  }
}

function settingsToValue(listIds){ 
  settings = [csvSeparator, hourFormat, dateFormat, hourColumns, dateColumns]
  for(let i = 0; i < listIds.length; i++){
    if(i < settings.length){
      document.getElementById(listIds[i]).value = settings[i]
    } else {
      document.getElementById(listIds[i]).value = dictionary[defaultHeadersArray[i - settings.length]]
    }
  }
}

function evaluateCriteriums(results){
  criteriumOvercrowding(results)
  criteriumOverlaping(results)
  criteriumClassRequisites(results) 
  console.log(substituteColumnNamesWithValues(results, expression, 500, columnNames))
  
  console.log(substituteColumnNamesWithValues(results, expression, 10000, columnNames))
}

function criteriumOvercrowding(results){
  // console.log(results.data[1]['Edifício']) //Como se acede a cada elemento
  let countOvercrowding = 0
  let countTotalStudentsOvercrowding = 0
  for(let i = 0; i < results.data.length; i++){
    let lotacao = results.data[i][dictionary['Lotação']]
    let inscritos = results.data[i][dictionary['Inscritos no turno']]
    if(lotacao - inscritos < 0 ){
      countOvercrowding++
      countTotalStudentsOvercrowding += Math.abs(lotacao - inscritos)
    }
  }  
  console.log("Total Overcrowdings: " + countOvercrowding)
  console.log("Total of Students With no place in Classes with OverCrowding: " + countTotalStudentsOvercrowding)
}

function criteriumOverlaping(results){
  let classesByDate = {};

  for (let i = 0; i < results.data.length; i++) {
    if (!classesByDate[results.data[i]['Dia']]) {
        classesByDate[results.data[i]['Dia']] = [];
    }
    classesByDate[results.data[i]['Dia']].push(results.data[i]);
  }

  let countOverlaping = 0
  Object.keys(classesByDate).forEach((date) => {
    let classesForDate = classesByDate[date];
    for (let i = 0; i < classesForDate.length - 1; i++) {
      for (let j = i + 1; j < classesForDate.length; j++) {
        if((classesForDate[i][dictionary['Início']] < classesForDate[j][dictionary['Fim']] && classesForDate[i][dictionary['Fim']] > classesForDate[j][dictionary['Início']]) ||
          (classesForDate[j][dictionary['Início']] < classesForDate[i][dictionary['Fim']] && classesForDate[j][dictionary['Fim']] > classesForDate[i][dictionary['Início']])){
            countOverlaping++
        }
      }
    }
  });
  console.log("Total of Overlapings: " + countOverlaping)
}

function criteriumClassRequisites(results){
  let countRequisitesNotMet = 0
  let countNoClassroom = 0
  for(let i = 0; i < results.data.length; i++){
    let askedRequisites = results.data[i][dictionary['Características da sala pedida para a aula']].split(" ") 
    let realRequisites = results.data[i][dictionary['Características reais da sala']]
    if(askedRequisites.every(term => realRequisites.includes(term))){
      countRequisitesNotMet++
    }
    if(realRequisites === ""){
      countNoClassroom++
    }

  }
  console.log("Total Requisites not met: " + countRequisitesNotMet)
  console.log("Total no classroom: " + countNoClassroom)
}

function countOccurrences(data, fieldIndex) {
  let dictionary = {};

  // Loop through the data and count occurrences of the specified field
  data.forEach((item) => {
      let fieldValue = item[fieldIndex];
      
      if (!dictionary[fieldValue]) {
          dictionary[fieldValue] = 1;
      } else {
          dictionary[fieldValue]++;
      }
  });

  return dictionary;
}

function criteriumNotUsedRequisites(resultsSchedule, resultsClassrooms){
  let dictionaryClassrooms = countOccurrences(resultsClassrooms, 'className');
  let dictionaryAskedRequisites = countOccurrences(resultsSchedule, 'Características da sala pedida para a aula');
  let dictionaryRealRequisites = countOccurrences(resultsSchedule,'Características reais da sala');


  // necessárias = pedidos - reais -> as diferentes das pedidas
  // sobram = classrooms - reais -> sobram em cada sala
  // sobram - necessárias
}

//function dynamicCriterium(expression){

//}

function extractColumnNamesFromExpression(expression, allColumnNames) {
  const foundColumnNames = [];

  allColumnNames.forEach(columnName => {
      if (expression.includes(columnName)) {
          foundColumnNames.push(columnName);
      }
  });

  return foundColumnNames;
}

function substituteColumnNamesWithValues(results, expression, row, columnNames) {
  let modifiedExpression = expression;

  columnNames.forEach(columnName => {
      modifiedExpression = modifiedExpression.replace(new RegExp(columnName, 'g'), results.data[row][columnName]);
  });


  try {
    const result = math.evaluate(modifiedExpression);
    console.log(`Result for row: ${result}`);
  } catch (error) {
      console.error(`Error evaluating expression for row: ${error}`);
  }

  return modifiedExpression;
}

// Example usage
const allColumnNames = ["Sala de aula", "Inscritos no turno", "Lotação"]; // All possible column names
const expression = "Inscritos no turno + Lotação > 10";
const columnNames = extractColumnNamesFromExpression(expression, allColumnNames);

console.log(columnNames); // ["Inscritos", "Lotacao"]


/**results.data.forEach(row => {
  const rowSpecificExpression = substituteColumnNamesWithValues(expression, row, columnNames);
  console.log(rowSpecificExpression); // This will log the expression with values substituted for each row
});**/
