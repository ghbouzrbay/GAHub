function loadExcelData() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
   
    if (!file) {
       return;
    }
   
    const reader = new FileReader();
   
    reader.onload = function(e) {
       const data = e.target.result;
       const workbook = XLSX.read(data, { type: 'binary' });
   
       const sheetName = workbook.SheetNames[0];
       const worksheet = workbook.Sheets[sheetName];
   
       const tableData = XLSX.utils.sheet_to_html(worksheet);
       document.getElementById('excelTable').innerHTML = tableData;
    };
   
    reader.readAsBinaryString(file);
   }
