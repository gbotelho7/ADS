
function handleParsedData(results, index, e, csvDataDiv, hiddenDiv, classroomsInput) {
  let headersMatch;
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
  else{
    headersMatch = expectedHeadersArray.every((header) => results.meta.fields.includes(header.trim()));
  }


  const dateFormatsMatch = dateColumns.split(";").every((column) =>
    results.meta.fields.includes(column) &&
    results.data.every(row =>  (moment(row[column], dateFormat, true).isValid() || row[column]=== '') )   //every moment(row[column], dateFormat, true).isValid()
  );

  const timeFormatsMatch = hourColumns.split(";").every((column) =>
    results.meta.fields.includes(column) &&
    results.data.every(row => (moment(row[column], hourFormat, true).isValid() || row[column]=== '')) //every moment(row[column], hourFormat, true).isValid()
  );

  if ((headersMatch && dateFormatsMatch && timeFormatsMatch) || (headersMatch && classroomsInput)) {
    if(hiddenDiv.style.display === "none"){
      hiddenDiv.style.display = "block"
    }
    const table = document.createElement("div");
    table.setAttribute("id", "csvTable" + index);
    csvDataDiv.appendChild(table);

    new Tabulator("#csvTable" + index, {
      data: results.data,
      layout: "fitData",
      autoColumns: true,
      pagination: "local",
      paginationSize: 7,
    });
  } else {
    if(hiddenDiv.style.display === "block" && classroomsInput){
      hiddenDiv.style.display = "none"
    }
    e.target.value = "";
    alert("As configurações do Ficheiro não correspondem aos esperados. Insira as alterações necessárias. A tabela anterior será eliminada");
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
      }
    });
  }
  saveSettings(csvSeparator, expectedHeaders, dynamicCriterium, hourFormat, dateFormat)
};

function saveSettings(){
  let settings = { "csvSeparator": csvSeparator, "expectedHeaders": expectedHeaders, "dynamicCriterium": dynamicCriterium, "hourFormat": hourFormat, "dateFormat": dateFormat, "dateColumns": dateColumns, "hourColumns": hourColumns};
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

function handleInputChange(elementId, variableToUpdate, action = null) {
  const element = document.getElementById(elementId);
  if (element && element.value !== "") {
    window[variableToUpdate] = element.value;
    if (action !== null) {
      action();
    }
  }
}

function settingsToValue(listIds){
  settings = [csvSeparator, hourFormat, dateFormat, expectedHeaders, hourColumns, dateColumns]
  for(let i = 0; i < listIds.length; i++){
    document.getElementById(listIds[i]).value = settings[i]
  }
}