// Recebe os dados e confirma se estão de acordo com as configurações 
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
    // console.log(Object.values(dictionary))
    // console.log(results.meta.fields)
    // console.log(headersMatch)
  }
  //console.log(headersMatch)

  const dateFormatsMatch = dateColumns.split(";").every((column) =>
    results.meta.fields.includes(column) &&
    results.data.every(row =>  (moment(row[column], dateFormat, true).isValid() || row[column]=== '') )
  );

  const timeFormatsMatch = hourColumns.split(";").every((column) =>
    results.meta.fields.includes(column) &&
    results.data.every(row => (moment(row[column], hourFormat, true).isValid() || row[column]=== '')) 
  );

  if ((headersMatch && dateFormatsMatch && timeFormatsMatch) || (headersMatch && classroomsInput)) {
    if (hiddenDiv.style.display === "none"){
      hiddenDiv.style.display = "block"
    }
    const table = document.createElement("div");
    table.setAttribute("id", "csvTable" + index);
    csvDataDiv.appendChild(table);
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

// Faz a recepção dos dados no caso dos URLs
function parseURLs(urls, e, csvDataDiv, hiddenDiv) {
  csvDataDiv.innerHTML = ""; // Clear previous data
  schedulesData = []
  urlsProcessed = 0 
  for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      Papa.parse(url, {
      download: true,
      delimiter: csvSeparator,
      header: true,
      complete: function (results) {
        const scheduleId = `Horário ${i + 1}`
        const scheduleData = { data: results.data };
        evaluateCriteriums(scheduleData)
        schedulesData[scheduleId] = scheduleData;
        console.log(schedulesData)
        handleParsedData(results, i, e, csvDataDiv, hiddenDiv, false);
        updateDynamicCriteriums(dropdown)

        urlsProcessed++
        if(urlsProcessed === urls.length){
          dynamicCriteriums.style.display = "block"
          schedulesData = orderSchedulesData(schedulesData)
          createTabulator(schedulesData, graphs, downloadContainer, modifiableTabulator)
          createLineChart()
        }
      }
    });
  }
  saveSettings()
};

// Guarda os diferentes dados
function saveSettings(){
  let settings = { "csvSeparator": csvSeparator, "hourFormat": hourFormat, "dateFormat": dateFormat, "dateColumns": dateColumns, "hourColumns": hourColumns, "dictionary": dictionary}; //dictionary
  localStorage.setItem('executionData', JSON.stringify(settings)); 
}

// Ajuda os Switches tanto de inputs como de critérios
function handleSwitch(input1, input2, toggleSwitch) {
  if(toggleSwitch.checked){
    input1.style.display = "none"
    input2.style.display = "block"
  } else{
    input1.style.display = "block"
    input2.style.display = "none"
  }
}

// Adiciona diferentes inputs no caso dos URLs
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

// Muda o valor da variável caso esta sofra alterações
function handleInputChange(elementId, variableToUpdate) {
  const element = document.getElementById(elementId);
  if (element && element.value !== "") {
    window[variableToUpdate] = element.value;
  }
}

// Coloca os valores guardados como values dos inputs
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

//Função que recolhe os diferentes resultados dos critérios estaticos e coloca tudo dentro de um objeto
function evaluateCriteriums(results){
  results  = criteriumOvercrowding(results)
  results = criteriumOverlaping(results)
  results = criteriumClassRequisites(results)
}

// Função que avalia o criterio de sobrelotação e conta o numero de alunos em sobrelotação
function criteriumOvercrowding(results){
  let countOvercrowding = 0
  let countTotalStudentsOvercrowding = 0
  for(let i = 0; i < results.data.length; i++){
    let lotacao = results.data[i][dictionary['Lotação']]
    let inscritos = results.data[i][dictionary['Inscritos no turno']]
    if(lotacao - inscritos < 0 ){
      countOvercrowding++
      countTotalStudentsOvercrowding += Math.abs(lotacao - inscritos)
      results.data[i]['OverCrowding'] = true 
    } else {
      results.data[i]['OverCrowding'] = false
    }
  } 
  let criteriumArray = {}
  criteriumArray['Overcrowding'] =countOvercrowding
  criteriumArray['OvercrowdingStudents'] = countTotalStudentsOvercrowding;

  results['criteriums'] = criteriumArray
  return results
}

// Função que avalia o critério de sobreposição de aulas
function criteriumOverlaping(results){
  let classesByDate = {};

  for (let i = 0; i < results.data.length; i++) {
    if (!classesByDate[results.data[i][dictionary['Dia']]]) {
      classesByDate[results.data[i][dictionary['Dia']]] = [];
    }
    classesByDate[results.data[i][dictionary['Dia']]].push(results.data[i]);
  }
  let countOverlaping = 0
  console.log(classesByDate)
  if(classesByDate !== 1){
    Object.keys(classesByDate).forEach((date) => {
      let classesForDate = classesByDate[date];
      for (let i = 0; i < classesForDate.length - 1; i++) {
        isTrue = false
        for (let j = i + 1; j < classesForDate.length; j++) {
          if((classesForDate[i][dictionary['Início']] < classesForDate[j][dictionary['Fim']] && classesForDate[i][dictionary['Fim']] > classesForDate[j][dictionary['Início']]) ||
            (classesForDate[j][dictionary['Início']] < classesForDate[i][dictionary['Fim']] && classesForDate[j][dictionary['Fim']] > classesForDate[i][dictionary['Início']])){
              countOverlaping++
              isTrue = true  
          }
        }
        if(isTrue){
          results.data[i]['OverLaping'] = true
        } else{
          results.data[i]['OverLaping'] = false
        }
      }
    });
  }
  results.criteriums['OverLaping'] = countOverlaping
  return results
}

// Função que avalia o critério de requesitos e que avalia o numero de aulas sem sala 
function criteriumClassRequisites(results){
  let countRequisitesNotMet = 0
  let countNoClassroom = 0
  for(let i = 0; i < results.data.length; i++){
    let askedRequisites = results.data[i][dictionary['Características da sala pedida para a aula']]
    let roomName = results.data[i][dictionary['Sala da aula']];
    if(roomName in classRoomDictionary){
      if(!classRoomDictionary[roomName].includes(askedRequisites)){
        countRequisitesNotMet++
        results.data[i]['RequisitesNotMet'] = true
        results.data[i]['NoClassroom'] = false
      } else{
        results.data[i]['RequisitesNotMet'] = false
        results.data[i]['NoClassroom'] = false
      }
    } else if(roomName === "") {
      countNoClassroom++
      results.data[i]['RequisitesNotMet'] = true
      results.data[i]['NoClassroom'] = true
    } else {
      results.data[i]['RequisitesNotMet'] = false
      results.data[i]['NoClassroom'] = false
    }
  }
  results.criteriums['RequisitesNotMet'] = countRequisitesNotMet
  results.criteriums['NoClassroom'] = countNoClassroom
  return results
}

function evaluateDynamicFormulaCriterium(schedulesData, expression) {
  const foundColumnNames = extractColumnNamesFromExpression(expression, Object.values(dictionary)); // Utiliza os valores do cabeçalho recebido
  let errorCounter = 0
  Object.keys(schedulesData).forEach((scheduleId) => {
    let errorOccured = false
    const schedule = schedulesData[scheduleId];
    const scheduleData = schedule.data; // Assuming data is stored under 'data' property
    let counter = 0
    scheduleData.forEach((row, index) => {
      const rowSpecificExpression = substituteColumnNamesWithValues(expression, row, foundColumnNames);
      try {
        const result = math.evaluate(rowSpecificExpression);
        if(result){
          counter++
          schedule.data[index][expression] = true;
        }
        else{
          schedule.data[index][expression] = false;
        }
      } catch (error) {
        console.error(`Error evaluating expression for row: ${error}`);
        errorOccured = true
        schedule.data[index][expression] = false;
      }
    });
    if(errorOccured){
      errorCounter++
    } else{
      schedule.criteriums[expression] = counter;
    }
  });
  console.log(errorCounter)
  if (errorCounter == Object.keys(schedulesData).length){
    alert("Ocorreu um erro e por isso não foram adicionados novos critérios por favor corriga a formula!")
  }
  return schedulesData

}


function extractColumnNamesFromExpression(expression, allColumnNames) {
  const foundColumnNames = [];

  allColumnNames.forEach(columnName => {
    if (expression.includes(columnName)) {
      foundColumnNames.push(columnName);
    }
  });

  return foundColumnNames;
}

function substituteColumnNamesWithValues(expression, row, columnNames) {
  let modifiedExpression = expression;

  columnNames.forEach(columnName => {
    const value = row[columnName];
    modifiedExpression = modifiedExpression.replace(new RegExp(columnName, 'g'), `"${value}"`);
  });
  console.log(modifiedExpression)
  return modifiedExpression;
}

function checkForExactWordMatch(expression, input) {
  const regexString = `\\b${input}\\b(?![\\w-])`;
  const regex = new RegExp(regexString);
  return regex.test(expression);
}


function evaluateDynamicTextCriterium(schedulesData, column, inputText) {
  const inputParsed = inputText.split('.').join(' ') //Problema com o Tabulator 
  const fieldName = `${column}=${inputParsed}`;
  Object.keys(schedulesData).forEach((scheduleId) => {
    let counter = 0;
    const schedule = schedulesData[scheduleId];

    schedule.data.forEach((row, index) => {
      //if (math.compareText(row[column], inputText) === 0) {
        if (checkForExactWordMatch(row[column], inputText)) {
        schedule.data[index][fieldName] = true
        counter++;
      } else {
        schedule.data[index][fieldName] = false
      }
    });
    console.log(`Dynamic criterium (${fieldName}): ${counter}`);
    schedule.criteriums[fieldName] = counter;
  });
  return schedulesData;
}

// Recebe os valores dos cabeçalhos e insere no dropdown dos critérios dinamicos
function updateDynamicCriteriums(dropdown){
  dropdown.innerHTML = '';
  //console.log("Teste " + dictionary)
  for (let key of Object.keys(dictionary)) {
    const option = document.createElement('option');
    option.value = key;
    option.text = key;
    dropdown.appendChild(option);
  }
}

// Recebe dados do ficheiro das salas e devolve um dicionário com as caracteristicas de cada uma 
function createClassRoomsDictionary(results){
  const classroomDictionary = {};

  results.data.forEach(row => {
    const roomName = row['Nome sala'];
    const xMarkedHeaders = [];

    Object.keys(row).forEach(key => {
      if (row[key] === 'X' && key !== 'Edifício' && key !== 'Nome sala' && key !== 'Capacidade Normal' && key !== 'Capacidade Exame' && key !== 'Nº características') {
        xMarkedHeaders.push(key);
      }
    });

    if (roomName && xMarkedHeaders.length > 0) {
      classroomDictionary[roomName] = xMarkedHeaders;
    }
  });
  classRoomDictionary = classroomDictionary
}

function orderSchedulesData(schedulesData){
  const scheduleNames = Object.keys(schedulesData);
  scheduleNames.sort();
  let sortedSchedulesData = {};
  scheduleNames.forEach((scheduleName) => {
    sortedSchedulesData[scheduleName] = schedulesData[scheduleName];
  });
  return sortedSchedulesData
}

function roundToNearestHour(time) {
  const date = new Date(`2023-01-01T${time}`);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.toTimeString().slice(0, 8);
}

function createModifiableTabulator(scheduleData){
 
const dictionaryValues = Object.values(dictionary); // Assuming 'dictionary' is your dictionary object

const columns = Object.keys(scheduleData[0]).map(key => {
  let column = {
    title: key,
    field: key,
    editor: "input",
    headerFilter: "input",
  };

  // Check if 'key' is not present in the values of the 'dictionary'
  if (!dictionaryValues.includes(key)) {
    column.formatter = "tickCross"; 
    column.editor = ""
    column.headerFilter = ""
  }

  return column;
});
  modifiableTable = new Tabulator("#modifiable-tabulator", {
    data: scheduleData,
    layout: "fitData",
    autoColumns: false,
    columns: [
      ...columns,
    ],
    pagination: "local",
    paginationSize: 7,
  });
}

// Recebe todos os dados e cria a tabela do Tabulator
function createTabulator(schedulesData, graphs, downloadContainer, modifiableTabulator){
  console.log(schedulesData)
  const scheduleIds = Object.keys(schedulesData);

  const firstSchedule = schedulesData[scheduleIds[0]];
  const criteria = Object.keys(firstSchedule.criteriums);
  
  const columns = [
    {formatter:"rowSelection", title:"Selecionado", headerSort:false},
    { title: "Horários", field: "scheduleId" },
    ...criteria.map((criterion) => ({
      title: criterion,
      field: criterion,
    })),
  ];

  const tableData = scheduleIds.map((id) => {
    const rowData = { scheduleId: id };
    criteria.forEach((criterion) => {
      rowData[criterion] = schedulesData[id].criteriums[criterion] || "-";
    });
    return rowData;
  });

  table = new Tabulator("#chart-container", {
    data: tableData,
    columns: columns,
    layout: "fitColumns",
    selectable: 1,
  });

  table.on("rowSelectionChanged", function(data, rows, selected, deselected){ //TODO Terminar
    if(data.length !== 0){
      let selectedScheduleData  = schedulesData[data[0]['scheduleId']].data
      console.log(data)
      createHeatMap(selectedScheduleData)
      //createChordDiagram(selectedScheduleData)
      modifiableDataTabulator = createModifiableTabulator(selectedScheduleData)
      insertDownloadButton(downloadContainer, selectedScheduleData);
    }
    else{
      graphs.innerHTML = ""
      downloadContainer.innerHTML = ""
      modifiableTabulator.innerHTML = ""
    }
  });
}



function insertDownloadButton(downloadContainer, selectedScheduleData, ) {
  const buttonJSON = document.createElement('button');
  buttonJSON.textContent = 'Download JSON';
  buttonJSON.onclick = function(){
    downloadFile(selectedScheduleData, false);
  };
  downloadContainer.appendChild(buttonJSON);
  const buttonCSV = document.createElement('button');
  buttonCSV.textContent = 'Download CSV';
  buttonCSV.onclick = function(){
    downloadFile(selectedScheduleData, true);
  };
  downloadContainer.appendChild(buttonCSV);
}

function downloadFile(selectedScheduleData, csv) {
  console.log(modifiableTable.getData()) //TODO Usar estes dados para criar os ficheiros 
  let fileData, blob, filename, filteredData;
  const link = document.createElement('a');

  if (csv === true) {
    const dictionaryValues = Object.values(dictionary);
    const headers = Object.keys(selectedScheduleData[0]).filter(key => dictionaryValues.includes(key));
    const dataRows = selectedScheduleData.map(row => {
      return headers.map(header => row[header]).join(csvSeparator);
    });

    fileData = [headers.join(csvSeparator), ...dataRows].join('\n');
    blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), fileData], { type: 'text/csv;charset=utf-8' });
    filename = 'data.csv';
  } else {
    filteredData = selectedScheduleData.map(row => {
      const filteredRow = {};
      Object.keys(row).forEach(key => {
        if (dictionary[key]) {
          filteredRow[dictionary[key]] = row[key];
        }
      });
      return filteredRow;
    });

    fileData = JSON.stringify(filteredData, null, 2);
    blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), fileData], { type: 'application/json;charset=utf-8' });

    filename = 'data.json';
  }

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Remove the link from the body
  document.body.removeChild(link);
}

function createLineChart(){
  const scheduleIds = Object.keys(schedulesData);
  const criteria = Object.keys(schedulesData[scheduleIds[0]].criteriums);
  const lineChartData = {
    chart: {
      caption: "Criteria for Schedules",
      xAxisName: "Criteriums",
      yAxisName: "Values",
      theme: "fusion",
    },
    categories: [
      {
        category: criteria.map((criterion) => ({ label: criterion })),
      },
    ],
    dataset: scheduleIds.map((id) => ({
      seriesname: `Schedule ${id}`,
      data: criteria.map((criterion) => ({
        value: schedulesData[id].criteriums[criterion] || 0,
      })),
    })),
  };

  new FusionCharts({
    type: "msline",
    renderAt: "line-chart-container",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: lineChartData,
  }).render();
}

function countRoomUsageByStartTime(scheduleData) {
  const roomUsageByStartTime = {};
  scheduleData.forEach(row => {
    const startTime = row[dictionary['Início']]
    const roomName = row[dictionary['Sala da aula']]; 
    if (startTime && roomName) {
      const roundedStartTime = roundToNearestHour(startTime);
      const key = `${roomName}/${roundedStartTime}`;
      roomUsageByStartTime[key] = (roomUsageByStartTime[key] || 0) + 1;
    }
  });

  return roomUsageByStartTime;
}

function createHeatMap(selectedScheduleData){
  const roomUsageByStartTime = countRoomUsageByStartTime(selectedScheduleData)
  console.log(roomUsageByStartTime)
    // Converta os dados para o formato esperado pela FusionCharts
  const heatMapChartData = [];
  for (var key in roomUsageByStartTime) {
      var roomName = key.split('/')[0];
      var startTime = key.split('/')[1];
      heatMapChartData.push({
        "rowid":  startTime,
        "columnid":roomName,
        "value": `${roomUsageByStartTime[key]}`
      });
  }
  heatMapChartData.sort((a, b) => {
    const timeA = a.rowid;
    const timeB = b.rowid;
    return timeA.localeCompare(timeB);
  });
  console.log(JSON.stringify(heatMapChartData))

  const values = heatMapChartData.map(item => parseInt(item.value, 10));

  // Step 2: Find the maximum and minimum values
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  // Step 3: Calculate the interval
  const interval = (maxValue - minValue) / 4;

  // Step 4: Define variables for starting values of each category
  const categoryStart1 = minValue;
  const categoryStart2 = minValue + interval;
  const categoryStart3 = minValue + 2 * interval;
  const categoryStart4 = minValue + 3 * interval;

  console.log(categoryStart1, categoryStart2, categoryStart3, minValue, maxValue)

  // Configurações do gráfico
  const heatMapConfig = {
    type: 'heatmap',
    renderAt: 'graphs',
    width: '100%',
    height: '800',
    dataFormat: 'json',
    dataSource: {
      "chart": {
        caption: 'Heatmap de Uso de Sala',
        subcaption: 'Por hora de início',
        theme: 'fusion',
      },
      "dataset": [
          {
            "data": heatMapChartData
          }
        ],
      "colorrange": {
        "gradient": "1",
        "startlabel": "Muito Bom",
        "code": "00A000",
        "color": [
            {
                "code": "00C000",
                "minvalue": `${categoryStart1}`,
                "maxvalue": `${categoryStart2}`,
                "label": "Bom"
            },
            {
                "code": "B0B000",
                "minvalue": `${categoryStart2}`,
                "maxvalue": `${categoryStart3}`,
                "label": "Médio"
            },
            {
                "code": "FFA040",
                "minvalue": `${categoryStart3}`,
                "maxvalue": `${categoryStart4}`,
                "label": "Mau"
            },
            {
              "code": "A02020",
              "minvalue": `${categoryStart4}`,
              "maxvalue": `${maxValue}`,
              "label": "Muito Mau"
          }
        ]
      }
    }
  };

  console.log("Length of heatMapChartData:", heatMapChartData.length);

   // Render FusionCharts
   FusionCharts.ready(function () {
    try {
      new FusionCharts(heatMapConfig).render();
    } catch (error) {
        console.error("Erro ao renderizar mapa de calor:", error);
    }
  });



  function createChordDiagram(schedulesData) {
    // Preparar dados para o diagrama de chord
    const chordData = prepareChordData(schedulesData);
  
    // Configurações do gráfico de chord
    const chordConfig = {
      width: 800,
      height: 800,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      padAngle: 0.02,
      sortGroups: d3.descending,
      sortSubgroups: d3.descending,
    };
  
    // Selecione o elemento SVG para o diagrama de chord
    const svg = d3.select('#chord-diagram')
      .append('svg')
      .attr('width', chordConfig.width)
      .attr('height', chordConfig.height)
      .append('g')
      .attr('transform', `translate(${chordConfig.width / 2},${chordConfig.height / 2})`);
  
    try {
      // Crie o layout de chord usando d3-chord
      const chordLayout = d3.chord()
        .padAngle(chordConfig.padAngle)
        .sortGroups(chordConfig.sortGroups)
        .sortSubgroups(chordConfig.sortSubgroups);
  
      const chords = chordLayout(chordData.matrix);
  
      // Configure e desenhe os arcos
      svg.selectAll('path')
        .data(chords)
        .enter()
        .append('path')
        .attr('d', d3.ribbon().radius(200))
        .style('fill', 'steelblue')
        .style('stroke', 'black');
  
    } catch (error) {
      console.error("Error creating chord diagram:", error);
    }
  }

function prepareChordData(schedulesData) {
  console.log("Preparing data for chord diagram...");

  // Criar um objeto para contar o número total de sobrelotações entre pares de cursos
  const overcrowdingCounts = {};

  // Iterar sobre os dados de horários
  Object.keys(schedulesData).forEach((scheduleId) => {
    const overcrowdingData = schedulesData[scheduleId].criteriums['Overcrowding'];

        // Add a check for the existence of 'Overcrowding' property
    if (overcrowdingData) {
      // Proceed with your existing code that uses overcrowdingData
    } else {
      // Handle the case when 'Overcrowding' property is not present
      console.error("Overcrowding property is undefined for scheduleId:", scheduleId);
    }
    const courses = Object.keys(overcrowdingData[1]);

    // Calcular as sobrelotações entre todos os pares de cursos
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const coursePair = [courses[i], courses[j]].sort().join('-');
        const count = overcrowdingData[1][courses[i]] + overcrowdingData[1][courses[j]];

        // Adicionar ao contador total
        overcrowdingCounts[coursePair] = (overcrowdingCounts[coursePair] || 0) + count;
      }
    }
  });

  // Ordenar os pares de cursos por contagem decrescente
  const sortedPairs = Object.keys(overcrowdingCounts).sort((a, b) => overcrowdingCounts[b] - overcrowdingCounts[a]);

  // Selecionar os 10 principais pares
  const topPairs = sortedPairs.slice(0, 10);

  // Estrutura de dados para o diagrama de chord
  const chordData = {
    matrix: [],
    entities: [],
  };

  // Mapear os pares de cursos para as entidades
  chordData.entities = topPairs.map((pair) => pair.split('-'));

  // Preencher a matriz com o número de sobrelotações compartilhadas
  chordData.matrix = topPairs.map((pair) => {
    const connections = new Array(topPairs.length).fill(0);

    topPairs.forEach((otherPair, index) => {
      const sharedOvercrowdedRooms = (pair === otherPair) ? overcrowdingCounts[pair] : 0;
      connections[index] = sharedOvercrowdedRooms;
    });

    return connections;
  });

  console.log("Chord data prepared:", chordData);

  return chordData;
}

// Chamar a função para criar o diagrama de chord
//createChordDiagram(selectedScheduleData);




// // Função para preparar os dados para o diagrama de chord
// function prepareChordData(schedulesData) {
//   console.log("Preparing data for chord diagram...");
//   // Estrutura de dados para o diagrama de chord
//   const chordData = {
//     matrix: [],
//     entities: [],
//   };

//   // Mapear os turnos ou turmas para as entidades
//   const scheduleIds = Object.keys(schedulesData);
//   chordData.entities = scheduleIds.map((scheduleId) => `Schedule ${scheduleId}`);

//   // Preencher a matriz com o número de salas de aula sobrelotadas compartilhadas
//   chordData.matrix = scheduleIds.map((scheduleId) => {
//     const connections = new Array(scheduleIds.length).fill(0);

//     scheduleIds.forEach((otherScheduleId, index) => {
//       const sharedOvercrowdedRooms = calculateSharedOvercrowdedRooms(
//         schedulesData[scheduleId].criteriums['Overcrowding'][1],
//         schedulesData[otherScheduleId].criteriums['Overcrowding'][1]
//       );
//       connections[index] = sharedOvercrowdedRooms;
//     });

//     return connections;
//   });

//   console.log("Chord data prepared:", chordData);

//   return chordData;
// }

// // Função para calcular o número de salas de aula sobrelotadas compartilhadas
// function calculateSharedOvercrowdedRooms(rooms1, rooms2) {
//   const sharedRooms = rooms1.filter((room) => rooms2.includes(room));
//   return sharedRooms.length;
// }



//   // Função para criar e exibir o diagrama de chord para sobrelotação de aulas
// function createChordDiagram(schedulesData) {
//   // Preparar dados para o diagrama de chord
//   const chordData = prepareChordData(schedulesData);

//   // Configurações do gráfico de chord
//   const chordConfig = {
//     width: 800,
//     height: 800,
//     margin: { top: 20, right: 20, bottom: 20, left: 20 },
//     padAngle: 0.02,
//     sortGroups: d3.descending,
//     sortSubgroups: d3.descending,
//   };

//   try {
//     const chord = new Chord(chordData, chordConfig);
//     chord.draw('chord-diagram');
//   } catch (error) {
//     console.error("Error creating chord diagram:", error);
//   }
// }



// Chamar a função para criar o diagrama de chord
//createChordDiagram(schedulesData);





}
