function loadPage(page) {
    // 1. Giriş yapmış kullanıcıyı kontrol et
    const user = JSON.parse(localStorage.getItem('user'));

    // 2. YETKİ KONTROLÜ: Admin değilse ve admin sayfasına girmeye çalışıyorsa login'e at
    if (page === 'admin' && (!user || user.role !== 'Admin')) {
        alert("Yetkiniz yok! Lütfen admin olarak giriş yapın.");
        loadPage('login');
        return;
    }

    // 3. HTML Sayfa Parçasını Getir
    fetch(`/views/${page}.html`)
        .then(res => res.text())
        .then(html => {
            // index.html içindeki 'app' (veya 'main-content') alanına bas
            document.getElementById('app').innerHTML = html;

            // 4. OTOMATİK VERİ YÜKLEME: Sayfa yüklendiğinde gerekli API'leri çağır
            if (page === 'admin') {
                getLabs();       // Laboratuvar tablosunu doldur
                getComputers();  // Bilgisayar tablosunu doldur
            }
            if (page === 'student') {
                getStudentComputer(); // Öğrencinin kendi bilgisayarını getir
            }
        })
        .catch(err => console.error("Sayfa yükleme hatası:", err));
}

// Uygulama ilk açıldığında login sayfasını getir
loadPage('login');

async function login() {
    const user = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });

    if (response.ok) {
        const data = await response.json();
        // Bilgileri tarayıcıda sakla
        localStorage.setItem('user', JSON.stringify(data));

        // Role göre yönlendir
        if (data.role === 'Admin') {
            loadPage('admin');
        } else {
            loadPage('student');
        }
    } else {
        alert("Giriş Başarısız!");
    }
}

function logout() {
    localStorage.removeItem('user'); // Kayıtlı kullanıcıyı sil
    loadPage('login'); // Giriş sayfasına dön
}

// --- LABORATUVAR İŞLEMLERİ ---

async function addLab() {
    const labName = document.getElementById('labName').value;

    if (!labName) {
        alert("Lütfen bir laboratuvar adı girin!");
        return;
    }

    const response = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: labName })
    });

    if (response.ok) {
        document.getElementById('labName').value = ''; // Başarılıysa kutuyu temizle
        getLabs(); // Listeyi anında güncelle
    } else {
        alert("Laboratuvar eklenirken bir hata oluştu.");
    }
}

async function getLabs() {
    const response = await fetch('/api/labs');
    const labs = await response.json();
    let tableHtml = '';
    let selectHtml = '';

    labs.forEach(lab => {
        tableHtml += `
            <tr>
                <td>${lab.id}</td>
                <td>${lab.name}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="updateLab(${lab.id}, '${lab.name}')">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteLab(${lab.id})">Sil</button>
                </td>
            </tr>`;
        selectHtml += `<option value="${lab.id}">${lab.name}</option>`;
    });

    document.getElementById('labTableBody').innerHTML = tableHtml;
    document.getElementById('pcLabId').innerHTML = selectHtml;
}

async function deleteLab(id) {
    if (confirm("Bu laboratuvarı silmek istediğinize emin misiniz?")) {
        const response = await fetch(`/api/labs/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert("Laboratuvar başarıyla silindi!");
            getLabs(); // Listeyi yenile
        } else {
            alert("Silme işlemi başarısız oldu.");
        }
    }
}

async function updateLab(id, oldName) {
    const newName = prompt("Laboratuvarın yeni adını girin:", oldName);

    // Eğer kullanıcı iptale basmazsa ve boş bırakmazsa güncelle
    if (newName && newName.trim() !== "" && newName !== oldName) {
        const response = await fetch(`/api/labs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, name: newName })
        });

        if (response.ok) {
            alert("Laboratuvar güncellendi!");
            getLabs(); // Listeyi yenile
        } else {
            alert("Güncelleme sırasında bir hata oluştu.");
        }
    }
}

// --- BİLGİSAYAR VE ATAMA İŞLEMLERİ ---

async function addComputer() {
    // 1. Kutulardaki değerleri al
    const labIdVal = document.getElementById('pcLabId').value;
    const brandVal = document.getElementById('pcBrand').value;
    const processorVal = document.getElementById('pcProcessor').value;
    const ramVal = document.getElementById('pcRam').value;

    // 2. Boş alan kontrolü
    if (!labIdVal || !brandVal || !processorVal || !ramVal) {
        alert("Lütfen bilgisayar eklemek için tüm alanları doldurun!");
        return;
    }

    // 3. Backend'e gönderilecek veri modeli
    const pcData = {
        labId: parseInt(labIdVal),
        brand: brandVal,
        processor: processorVal,
        ram: parseInt(ramVal)
    };

    try {
        const response = await fetch('/api/computers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pcData)
        });

        if (response.ok) {
            alert("Bilgisayar başarıyla eklendi ve Demirbaş Kodu üretildi!");
            getComputers(); // Alt tabloyu yenile

            // Kutuların içini temizle
            document.getElementById('pcBrand').value = '';
            document.getElementById('pcProcessor').value = '';
            document.getElementById('pcRam').value = '';
        } else {
            alert("Bilgisayar eklenemedi! Lütfen F12'ye basıp Console ekranındaki hatayı kontrol edin.");
        }
    } catch (error) {
        console.error("Fetch Hatası:", error);
    }
}

async function getComputers() {
    const response = await fetch('/api/computers');
    const pcs = await response.json();
    let html = '';

    pcs.forEach(pc => {
        // Öğrenci atanmış mı kontrol et
        const statusBadge = pc.userId
            ? `<span class="badge bg-success">Zimmetli</span>`
            : `<span class="badge bg-secondary">Boşta</span>`;

        html += `
            <tr>
                <td><strong>${pc.assetCode}</strong></td>
                <td>${pc.brand} / ${pc.processor} / ${pc.ram}GB RAM</td>
                <td>
                    ${statusBadge}
                    <button class="btn btn-sm btn-outline-primary ms-2" onclick="assignStudent(${pc.id})">Öğrenci Ata</button>
                </td>
            </tr>`;
    });

    document.getElementById('pcTableBody').innerHTML = html;
}

async function assignStudent(pcId) {
    const studentNo = prompt("Öğrenci No:");
    const fullName = prompt("Öğrenci Ad Soyad:");

    await fetch(`/api/assign?pcId=${pcId}&studentNo=${studentNo}&fullName=${fullName}`, {
        method: 'POST'
    });
    getComputers(); // Listeyi yenile
}

// --- ÖĞRENCİ PORTALI ---

async function getStudentComputer() {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch(`/api/my-computer/${user.id}`);
    if (response.ok) {
        const pc = await response.json();
        document.getElementById('student-pc-info').innerHTML = `
            <div class="card p-3 border-primary shadow-sm">
                <h4><i class="fas fa-desktop text-primary"></i> Zimmetli Bilgisayarım</h4>
                <hr>
                <p><strong>Demirbaş Kodu:</strong> <span class="text-danger">${pc.assetCode}</span></p>
                <p><strong>Donanım:</strong> ${pc.brand} / ${pc.processor} / ${pc.ram}GB RAM</p>
            </div>`;
    } else {
        document.getElementById('student-pc-info').innerHTML = `
            <div class="alert alert-warning">
                Şu anda üzerinize zimmetli bir bilgisayar bulunmamaktadır.
            </div>`;
    }
}