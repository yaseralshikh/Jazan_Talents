
google.charts.load('current', { packages: ['table'] });
google.charts.setOnLoadCallback(loadData);

let allData;
let dataTable;

const spreadsheetId = '10R3flKxq0TRXFM7W2K7xoLRxWpNmtu68xEti7d1HP_U';
const sheetName = 'Data';
const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${sheetName}`;

function loadData() {
  fetch(sheetUrl)
    .then(res => res.text())
    .then(rep => {
      const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
      dataTable = new google.visualization.DataTable(jsonData.table);
      allData = dataTable;
      populateFilters();
      filterAndDraw();
      initializeSelect2(); // تهيئة Select2 بعد تحميل البيانات لأول مرة
    });
  document.getElementById("toggleSensitive").addEventListener('change', filterAndDraw);
}

function initializeSelect2() {
  $(document).ready(function () {
    $('#schoolSelect').select2({
      dir: "rtl",
      width: '100%',
      placeholder: 'اختر مدرسة'
    });
  });
}

function populateFilters() {
  const sectorSelect = document.getElementById("sectorSelect");
  const stageSelect = document.getElementById("stageSelect");
  const schoolSelect = document.getElementById("schoolSelect");
  const categorySelect = document.getElementById("categorySelect");

  const sectors = new Set();
  const stages = new Set();
  const categories = new Set();

  for (let i = 0; i < allData.getNumberOfRows(); i++) {
    sectors.add(allData.getValue(i, 0));
    stages.add(allData.getValue(i, 1));
    categories.add(allData.getValue(i, 7));
  }

  sectors.forEach(s => sectorSelect.innerHTML += `<option value="${s}">${s}</option>`);
  stages.forEach(s => stageSelect.innerHTML += `<option value="${s}">${s}</option>`);
  categories.forEach(s => categorySelect.innerHTML += `<option value="${s}">${s}</option>`);

  sectorSelect.addEventListener('change', () => {
    updateSchoolDropdown();
    filterAndDraw();
  });
  stageSelect.addEventListener('change', () => {
    updateSchoolDropdown();
    filterAndDraw();
  });
  categorySelect.addEventListener('change', filterAndDraw);
  $('#schoolSelect').on('change', filterAndDraw);
}

function updateSchoolDropdown() {
  const sector = document.getElementById("sectorSelect").value;
  const stage = document.getElementById("stageSelect").value;

  const $schoolSelect = $('#schoolSelect');

  // ✨ احفظ القيمة الحالية قبل التحديث
  const previousValue = $schoolSelect.val();

  // ✨ إيقاف التهيئة السابقة إن وجدت
  if ($schoolSelect.hasClass("select2-hidden-accessible")) {
    $schoolSelect.select2('destroy');
  }

  // ✨ أفرغ القائمة
  $schoolSelect.empty();

  // ✨ أضف الخيار الافتراضي "اختر مدرسة" مع تحديده إذا لم يكن هناك اختيار سابق
  const defaultOption = new Option("اختر مدرسة", "", true, !previousValue);
  $schoolSelect.append(defaultOption);

  // ✨ أضف المدارس المتاحة بناءً على القطاع والمرحلة
  const schools = new Set();
  for (let i = 0; i < allData.getNumberOfRows(); i++) {
    const currentSector = allData.getValue(i, 0);
    const currentStage = allData.getValue(i, 1);
    const currentSchool = allData.getValue(i, 2);
    if ((!sector || currentSector === sector) &&
        (!stage || currentStage === stage)) {
      schools.add(currentSchool);
    }
  }

  schools.forEach(school => {
    const option = new Option(school, school, false, previousValue === school);
    $schoolSelect.append(option);
  });

  // ✨ إعادة التهيئة باستخدام Select2
  $schoolSelect.select2({
    dir: "rtl",
    width: '100%',
    placeholder: 'اختر مدرسة'
  });
}


// function updateSchoolDropdown() {
//   const sector = document.getElementById("sectorSelect").value;
//   const stage = document.getElementById("stageSelect").value;

//   const $schoolSelect = $('#schoolSelect');

//   // إيقاف التهيئة السابقة
//   if ($schoolSelect.hasClass("select2-hidden-accessible")) {
//     $schoolSelect.select2('destroy');
//   }

//   // إعادة تعبئة القائمة
//   $schoolSelect.empty().append('<option value="">اختر مدرسة</option>');

//   const schools = new Set();
//   for (let i = 0; i < allData.getNumberOfRows(); i++) {
//     const currentSector = allData.getValue(i, 0);
//     const currentStage = allData.getValue(i, 1);
//     const currentSchool = allData.getValue(i, 2);
//     if ((!sector || currentSector === sector) &&
//         (!stage || currentStage === stage)) {
//       schools.add(currentSchool);
//     }
//   }

//   schools.forEach(school => {
//     $schoolSelect.append(`<option value="${school}">${school}</option>`);
//   });

//   // إعادة تهيئة Select2 بعد التحديث
//   $schoolSelect.select2({
//     dir: "rtl",
//     width: '100%',
//     placeholder: 'اختر مدرسة'
//   });
// }

function filterAndDraw() {
  const sector = document.getElementById("sectorSelect").value;
  const stage = document.getElementById("stageSelect").value;
  const school = document.getElementById("schoolSelect").value;
  const category = document.getElementById("categorySelect").value;
  const showSensitive = document.getElementById("toggleSensitive").checked;

  const filteredRows = [];

  for (let i = 0; i < allData.getNumberOfRows(); i++) {
    const matchSector = !sector || allData.getValue(i, 0) === sector;
    const matchStage = !stage || allData.getValue(i, 1) === stage;
    const matchSchool = !school || allData.getValue(i, 2) === school;
    const matchCategory = !category || allData.getValue(i, 7) === category;

    if (matchSector && matchStage && matchSchool && matchCategory) {
      filteredRows.push(i);
    }
  }

  const view = new google.visualization.DataView(allData);
  view.setRows(filteredRows);
  view.setColumns([2, 3, 4, 5, 6, 7]);

  // const numberedData = [["#", "اسم الطالب", "السجل المدني", "الجوال", "الصف", "التصنيف", "المدرسة"]];
  const header = ["#", "اسم الطالب"];
  if (showSensitive) header.push("السجل المدني", "الجوال");
  header.push("الصف", "التصنيف", "المدرسة");

  const numberedData = [header];
  
  for (let i = 0; i < view.getNumberOfRows(); i++) {
    const studentName = view.getValue(i, 1) || "";
    const id = String(view.getValue(i, 2) || "").replace(/\D/g, '');
    const phone = String(view.getValue(i, 3) || "").replace(/\D/g, '');
    const className = view.getValue(i, 4) || "";
    const categoryVal = view.getValue(i, 5) || "";
    const schoolName = view.getValue(i, 0) || "";

    const row = [i + 1, studentName];
    if (showSensitive) row.push(id, phone);
    row.push(className, categoryVal, schoolName);
    numberedData.push(row);
  }

  const finalTable = google.visualization.arrayToDataTable(numberedData);
  const table = new google.visualization.Table(document.getElementById('table_div'));
  table.draw(finalTable, {
    showRowNumber: false,
    width: '100%',
    // page: 'enable',
    // pageSize: 50, // عدد الصفوف في كل صفحة
    // pagingSymbols: {prev: 'السابق', next: 'التالي'},
    // pagingButtonsConfiguration: 'auto'
  });

  document.getElementById("schoolNameTitle").innerText = school || "";
  document.getElementById("pdfBtn").disabled = false;

    // توسيط عمود الترقيم بعد رسم الجدول
  const tableDiv = document.getElementById('table_div');
  const cells = tableDiv.querySelectorAll('td:nth-child(1), th:nth-child(1)');
  cells.forEach(cell => {
    cell.style.textAlign = 'center';
  });

  document.getElementById("rowCount").innerText = `عدد الطلاب: ${view.getNumberOfRows()}`;
}

function downloadPDF() {
  const element = document.getElementById('element-to-pdf');
  const opt = {
    margin: 0.5,
    filename: 'بيانات-الطلاب.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(element).save();
}
