function handleParsedData(results, index, csvDataDiv) {
    const headersMatch = expectedHeadersArray.every((header) => results.meta.fields.includes(header.trim()));
    console.log(expectedHeadersArray)
    console.log(results.meta.fields)

    if (headersMatch) {
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
      alert("As configurações do Ficheiro não correspondem aos esperados. Insira as alterações necessárias. A tabela anterior será eliminada");
    }
};

function parseURLs(urls, csvDataDiv) {
    csvDataDiv.innerHTML = ""; // Clear previous data

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        //e.target.value = "";
        Papa.parse(url, {
        download: true,
        delimiter: csvSeparator,
        header: true,
        complete: function (results) {
            handleParsedData(results, i, csvDataDiv);
        }
        });
    }
    saveSettings(csvSeparator, expectedHeaders, dynamicCriterium, hourFormat, dateFormat)
};

function saveSettings(csvSeparator, expectedHeaders, dynamicCriterium, hourFormat, dateFormat){
let settings = { "csvSeparator": csvSeparator, "expectedHeaders": expectedHeaders, "dynamicCriterium": dynamicCriterium, "hourFormat": hourFormat, "dateFormat": dateFormat};
localStorage.setItem('executionData', JSON.stringify(settings)); 
}