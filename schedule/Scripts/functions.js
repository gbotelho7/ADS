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
    // if (!classroomsInput){
    //   new Tabulator("#csvTable" + index, {
    //     data: results.data,
    //     layout: "fitData",
    //     autoColumns: true,
    //     pagination: "local",
    //     paginationSize: 7,
    //   });
    // }

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
        scheduleData['criteriums'] = evaluateCriteriums(results);
        schedulesData[scheduleId] = scheduleData;

        handleParsedData(results, i, e, csvDataDiv, hiddenDiv, false);
        updateDynamicCriteriums(dropdown)

        urlsProcessed++
        if(urlsProcessed === urls.length){
          createTabulator(schedulesData)
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
  let criteriumArray = {}
  let criterium = []
  criterium = criteriumOvercrowding(results)
  criteriumArray['Overcrowding'] = criterium[0]
  criteriumArray['OvercrowdingStudents'] = criterium[1];
  criteriumArray['Overlaping'] = criteriumOverlaping(results)
  criterium = criteriumClassRequisites(results) 
  criteriumArray['RequisitesNotMet'] = criterium[0]
  criteriumArray['NoClassroom'] = criterium[1];
  return criteriumArray
}

// Função que avalia o criterio de sobrelotação e conta o numero de alunos em sobrelotação
function criteriumOvercrowding(results){
  let arr = []
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
  arr.push(countOvercrowding)
  arr.push(countTotalStudentsOvercrowding)
  console.log(arr)
  return arr
  //console.log("Total Overcrowdings: " + countOvercrowding)
  //console.log("Total of Students With no place in Classes with OverCrowding: " + countTotalStudentsOvercrowding)
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
        for (let j = i + 1; j < classesForDate.length; j++) {
          if((classesForDate[i][dictionary['Início']] < classesForDate[j][dictionary['Fim']] && classesForDate[i][dictionary['Fim']] > classesForDate[j][dictionary['Início']]) ||
            (classesForDate[j][dictionary['Início']] < classesForDate[i][dictionary['Fim']] && classesForDate[j][dictionary['Fim']] > classesForDate[i][dictionary['Início']])){
              countOverlaping++
          }
        }
      }
    });
  }
  // console.log("Total of Overlapings: " + countOverlaping)
  return countOverlaping
}

// Função que avalia o critério de requesitos e que avalia o numero de aulas sem sala 
function criteriumClassRequisites(results){
  let arr = []
  let countRequisitesNotMet = 0
  let countNoClassroom = 0
  for(let i = 0; i < results.data.length; i++){
    let askedRequisites = results.data[i][dictionary['Características da sala pedida para a aula']]
    let roomName = results.data[i][dictionary['Sala da aula']];
    if(roomName in classRoomDictionary){
      if(!classRoomDictionary[roomName].includes(askedRequisites)){
        countRequisitesNotMet++
      }
    } else if(roomName === "") {
      countNoClassroom++
    }
  }
  arr.push(countRequisitesNotMet)
  arr.push(countNoClassroom)
  return arr
  //console.log("Total Requisites not met: " + countRequisitesNotMet)
  //console.log("Total no classroom: " + countNoClassroom)
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

function evaluateDynamicFormulaCriterium(schedulesData, expression) {
  const foundColumnNames = extractColumnNamesFromExpression(expression, Object.values(dictionary)); // Utiliza os valores do cabeçalho recebido
  let errorCounter = 0
  Object.keys(schedulesData).forEach((scheduleId) => {
    let errorOccured = false
    const schedule = schedulesData[scheduleId];
    const scheduleData = schedule.data; // Assuming data is stored under 'data' property
    let counter = 0
    scheduleData.forEach((row) => {
      const rowSpecificExpression = substituteColumnNamesWithValues(expression, row, foundColumnNames);
      try {
        const result = math.evaluate(rowSpecificExpression);
        if(result){
          counter++
        }
      } catch (error) {
        console.error(`Error evaluating expression for row: ${error}`);
        errorOccured = true
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

function evaluateDynamicTextCriterium(schedulesData, column, inputText) {
  // Generate the field name dynamically based on column and inputText
  const inputParsed = inputText.split('.').join(' ') //Problema com o Tabulator 
  const fieldName = `${column}=${inputParsed}`;

  // Iterate through each schedule
  Object.keys(schedulesData).forEach((scheduleId) => {
    let counter = 0;
    const schedule = schedulesData[scheduleId];

    // Iterate through each row of data in the schedule
    schedule.data.forEach((row) => {
      if (math.compareText(row[column], inputText) === 0) {
        counter++;
      }
    });
    console.log(`Dynamic criterium (${fieldName}): ${counter}`);
    // Update the criteriums field for the schedule using the dynamic field name
    schedule.criteriums[fieldName] = counter;
  });

  //console.log(`Dynamic criterium (${fieldName}): ${counter}`);
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

// Recebe todos os dados e cria a tabela do Tabulator
function createTabulator(schedulesData, graphs, downloadContainer){
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
      insertDownloadButton(downloadContainer, selectedScheduleData);
    }
    else{
      graphs.innerHTML = ""
      downloadContainer.innerHTML = ""
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
  let fileData, blob, filename;
  const link = document.createElement('a');
  if(csv === true){
    const headers = Object.keys(selectedScheduleData[0]);
    const dataRows = selectedScheduleData.map(row => headers.map(header => row[header]).join(','));
    fileData = [headers.join(','), ...dataRows].join('\n');
    blob = new Blob([fileData], { type: 'text/csv' });
    filename = 'data.csv';
  } else{
    fileData = JSON.stringify(selectedScheduleData, null, 2);
    blob = new Blob([fileData], { type: 'application/json' });
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
  // Iterar sobre cada linha de dados no horário
  scheduleData.forEach(row => {
    const startTime = row[dictionary['Início']]
    const roomName = row[dictionary['Sala da aula']]; 

    // Verificar se a sala e a hora de início estão presentes nos dados
    if (startTime && roomName) {
      const roundedStartTime = roundToNearestHour(startTime);
      // Criar um identificador único para a combinação sala + hora de início
      const key = `${roomName}/${roundedStartTime}`;

      // Incrementar o contador para essa combinação
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



  // Função para criar e exibir o diagrama de chord para sobrelotação de aulas
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

  const chord = d3.chord()
    .padAngle(chordConfig.padAngle)
    .sortGroups(chordConfig.sortGroups)
    .sortSubgroups(chordConfig.sortSubgroups);

  const chordLayout = chord(chordData.matrix);

  const svg = d3.select('#chord-diagram')
    .append('svg')
    .attr('width', chordConfig.width)
    .attr('height', chordConfig.height)
    .append('g')
    .attr('transform', `translate(${chordConfig.width / 2},${chordConfig.height / 2})`);

  // Use chordLayout to draw the diagram
  // Refer to d3-chord documentation for more details: https://observablehq.com/@d3/chord-diagram


}



// Função para preparar os dados para o diagrama de chord
function prepareChordData(schedulesData) {
  console.log("Preparing data for chord diagram...");
  // Estrutura de dados para o diagrama de chord
  const chordData = {
    matrix: [],
    entities: [],
  };

  // Mapear os turnos ou turmas para as entidades
  const scheduleIds = Object.keys(schedulesData);
  chordData.entities = scheduleIds.map((scheduleId) => `Schedule ${scheduleId}`);

  // Preencher a matriz com o número de salas de aula sobrelotadas compartilhadas
  chordData.matrix = scheduleIds.map((scheduleId) => {
    const connections = new Array(scheduleIds.length).fill(0);

    scheduleIds.forEach((otherScheduleId, index) => {
      const sharedOvercrowdedRooms = calculateSharedOvercrowdedRooms(
        schedulesData[scheduleId].criteriums['Overcrowding'][1],
        schedulesData[otherScheduleId].criteriums['Overcrowding'][1]
      );
      connections[index] = sharedOvercrowdedRooms;
    });

    return connections;
  });

  console.log("Chord data prepared:", chordData);

  return chordData;
}

// Função para calcular o número de salas de aula sobrelotadas compartilhadas
function calculateSharedOvercrowdedRooms(rooms1, rooms2) {
  const sharedRooms = rooms1.filter((room) => rooms2.includes(room));
  return sharedRooms.length;
}



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
