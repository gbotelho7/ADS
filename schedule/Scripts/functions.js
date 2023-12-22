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
  let settings = { "csvSeparator": csvSeparator, "hourFormat": hourFormat, "dateFormat": dateFormat, "dateColumns": dateColumns, "hourColumns": hourColumns, "dictionary": dictionary};
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
  return arr
  //console.log("Total Overcrowdings: " + countOvercrowding)
  //console.log("Total of Students With no place in Classes with OverCrowding: " + countTotalStudentsOvercrowding)
}

// Função que avalia o critério de sobreposição de aulas
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
    let roomName = results.data[i]['Sala da aula'];
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


// Recebe todos os dados e cria a tabela do Tabulator
function createTabulator(schedulesData){
  const scheduleIds = Object.keys(schedulesData);

  const firstSchedule = schedulesData[scheduleIds[0]];
  const criteria = Object.keys(firstSchedule.criteriums);
  
  const columns = [
    {formatter:"rowSelection", title:"Selecionado", align:"center", headerSort:false},
    { title: "Horários", field: "scheduleId" }, // Column for Schedule ID
    // Columns for each criterium
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

  console.log(tableData)

  table = new Tabulator("#graphs", {
    data: tableData,
    columns: columns,
    layout: "fitColumns",
    selectable: 1
    // Add any other configurations you need
  });

  // 
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

 

  function countRoomUsageByStartTime(schedulesData) {
    const roomUsageByStartTime = {};
  
    // Iterar sobre cada horário
    Object.keys(schedulesData).forEach(scheduleId => {
      const schedule = schedulesData[scheduleId];
      const scheduleData = schedule.data;
  
      // Iterar sobre cada linha de dados no horário
      scheduleData.forEach(row => {
        const startTime = row['Início']
        const roomName = row['Sala da aula'];
  
        // Verificar se a sala e a hora de início estão presentes nos dados
        if (startTime && roomName) {
          // Criar um identificador único para a combinação sala + hora de início
          const key = `${roomName}-${startTime}`;
  
          // Incrementar o contador para essa combinação
          roomUsageByStartTime[key] = (roomUsageByStartTime[key] || 0) + 1;
        }
      });
    });
  
    return roomUsageByStartTime;
  }

  const roomUsageByStartTime = countRoomUsageByStartTime(schedulesData)
  console.log(roomUsageByStartTime)
    // Converta os dados para o formato esperado pela FusionCharts
  const heatMapChartData = [];
  for (var key in roomUsageByStartTime) {
      var roomName = key.split('-')[0];
      var startTime = key.split('-')[1];
      heatMapChartData.push({
          "rowid": roomName,
          "columnid": startTime,
          "value": roomUsageByStartTime[key]
      });
  }
  console.log(heatMapChartData[0])



  // Configurações do gráfico
  const heatMapConfig = {
    type: 'heatmap',
    renderAt: 'heatmap-container',
    width: '700',
    height: '400',
    dataFormat: 'json',
    dataSource: {
      chart: {
        caption: 'Heatmap de Uso de Sala',
        subcaption: 'Por hora de início',
        theme: 'fusion',
      },
      data: heatMapChartData,
    },
  };



  console.log("Length of heatMapChartData:", heatMapChartData.length);




    // Imprimir os dados no console
  console.log("Dados do heatMapChartData:");
  heatMapChartData.forEach(item => {
      console.log(`Row ID: ${item.rowid}, Column ID: ${item.columnid}, Value: ${item.value}`);
  });



   // Render FusionCharts
   FusionCharts.ready(function () {
    new FusionCharts({
      type: "msline",
      renderAt: "chart-container",
      width: "100%",
      height: "400",
      dataFormat: "json",
      dataSource: lineChartData,
    }).render();
    try {
      new FusionCharts(heatMapConfig).render();
    } catch (error) {
        console.error("Erro ao renderizar mapa de calor:", error);
    }
  });
  
}