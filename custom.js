
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
  document.getElementById("searchInput").addEventListener("input", filterAndDraw);

  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  
  searchInput.addEventListener("input", () => {
    // أظهر ❌ إذا كان هناك نص
    clearSearchBtn.classList.toggle("d-none", searchInput.value.trim() === "");
    filterAndDraw();
  });
  
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("d-none");
    filterAndDraw();
  });
}

function initializeSelect2() {
  $(document).ready(function () {
    $('#schoolSelect').select2({
      dir: "rtl",
      width: '100%',
      placeholder: 'اختر مدرسة'
    });
    $('#categorySelect').select2({
      dir: "rtl",
      width: '100%',
      placeholder: "اختر تصنيفًا",
      allowClear: true,
      language: {
        noResults: function () {
          return "لا توجد نتائج";
        }
      }
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
  $('#categorySelect').on('change', filterAndDraw);
}

function updateSchoolDropdown() {
  const sector = document.getElementById("sectorSelect").value;
  const stage = document.getElementById("stageSelect").value;

  const $schoolSelect = $('#schoolSelect');
  const previousValue = $schoolSelect.val();

  // ✨ Destroy Select2 if already initialized
  if ($schoolSelect.hasClass("select2-hidden-accessible")) {
    $schoolSelect.select2('destroy');
  }

  // ✨ Clear and rebuild the options
  $schoolSelect.empty();

  // ✨ Add "عرض الكل" manually as the first option
  $schoolSelect.append(new Option("عرض الكل", "", false, !previousValue));

  // ✨ Fill the rest of schools
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
    $schoolSelect.append(new Option(school, school, false, previousValue === school));
  });

  // ✨ Re-initialize Select2 with proper placeholder & allowClear
  $schoolSelect.select2({
    dir: "rtl",
    width: '100%',
    placeholder: "عرض الكل",
    allowClear: true, // this enables X icon to clear
    language: {
      noResults: function () {
        return "لا توجد نتائج";
      }
    }
  });

  // ✨ Force placeholder activation
  if (!previousValue) {
    $schoolSelect.val("").trigger("change");
  }
}

function filterAndDraw() {
  const searchText = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const sector = document.getElementById("sectorSelect").value;
  const stage = document.getElementById("stageSelect").value;
  const school = document.getElementById("schoolSelect").value;
  //const category = document.getElementById("categorySelect").value;
  // const selectedCategories = $('#categorySelect').val(); // مصفوفة من القيم المختارة
  const categories = $('#categorySelect').val(); // مصفوفة
  
  const showSensitive = document.getElementById("toggleSensitive").checked;

  const filteredRows = [];

  for (let i = 0; i < allData.getNumberOfRows(); i++) {
    const matchSector = !sector || allData.getValue(i, 0) === sector;
    const matchStage = !stage || allData.getValue(i, 1) === stage;
    const matchSchool = !school || allData.getValue(i, 2) === school;
    //const matchCategory = !category || allData.getValue(i, 7) === category;
    const matchCategory = !categories || categories.length === 0 || categories.includes(allData.getValue(i, 7));

    const studentName = (allData.getValue(i, 3) || "").toLowerCase();
    const id = String(allData.getValue(i, 4) || "");
    
    const matchSearch = !searchText || studentName.includes(searchText) || id.includes(searchText);
    
    if (matchSector && matchStage && matchSchool && matchCategory && matchSearch) {
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

    // توسيط عمود الترقيم بعد رسم الجدول
  const tableDiv = document.getElementById('table_div');
  const cells = tableDiv.querySelectorAll('td:nth-child(1), th:nth-child(1)');
  cells.forEach(cell => {
    cell.style.textAlign = 'center';
  });

  document.getElementById("rowCount").innerText = `عدد الطلاب: ${view.getNumberOfRows()}`;
}

function downloadExcel() {
  const table = document.querySelector('#table_div table');
  if (!table) return alert("لا توجد بيانات حالياً لتصديرها");

  // الحصول على اسم المدرسة المحددة
  const school = document.getElementById("schoolSelect").value;
  const schoolName = school ? `-${school.replace(/\s+/g, "-")}` : "";

  // إنشاء ملف Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "الطلاب");

  // تحديد اسم الملف باستخدام اسم المدرسة
  const fileName = `بيانات-الطلاب${schoolName}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

