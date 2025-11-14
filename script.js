/* 3D Carousel + Upload + Stop/Restart/Update + Video Recording */

document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('imageInput');
  const startBtn = document.getElementById('startCarousel');
  const scene = document.getElementById('scene');
  const carousel = document.getElementById('carousel');
  const uploader = document.getElementById('uploader');

  let selectedFiles = [];

  // Dosyalar seçilince sadece image/* filtrele
  fileInput.addEventListener('change', function (e) {
    const files = Array.from(e.target.files);
    selectedFiles = files.filter(f => f.type.startsWith('image/'));
  });

  // "Start Carousel" butonuna tıklanınca
  startBtn.addEventListener('click', function () {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please choose at least one image.');
      return;
    }

    // Eski img'leri temizle
    scene.innerHTML = '';

    // Seçilen her dosya için img elementi oluştur
    selectedFiles.forEach(function (file) {
      const img = document.createElement('img');
      img.className = 'carousel_item';
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      scene.appendChild(img);
    });

    // Uploader'ı gizle, carousel'i göster
    uploader.style.display = 'none';
    carousel.style.display = 'block';

    // Carousel başlat
    carouselRUN();
  });

  // Video kayıt butonlarını hazırla
  setupRecordingControls();
});

function carouselRUN() {
  const carousel = document.getElementById("carousel");
  const scene = document.getElementById("scene");
  const items = scene.getElementsByClassName("carousel_item");
  const carousel_btn = document.getElementById("carousel_btn");

  const n = items.length;
  if (!n) return;

  let currIndex = 0;
  const theta = (Math.PI * 2) / n;
  let interval = null;
  const autoCarousel = carousel.dataset.auto;

  function stopCarousel() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function setCarouselInterval() {
    stopCarousel();
    interval = setInterval(function () {
      currIndex++;
      scene.style.transform = "rotateY(" + (currIndex * -theta) + "rad)";
    }, 3000);
  }

  function setupCarousel(width) {
    const apothem = width / (2 * Math.tan(Math.PI / n));
    scene.style.transformOrigin = "50% 50% " + (-apothem) + "px";

    for (let i = 1; i < n; i++) {
      items[i].style.transformOrigin = "50% 50% " + (-apothem) + "px";
      items[i].style.transform = "rotateY(" + (i * theta) + "rad)";
    }

    if (autoCarousel === "true") {
      setCarouselInterval();
    }
  }

  // İlk kurulum
  setupCarousel(parseFloat(getComputedStyle(items[0]).width));

  // Pencere boyutu değişince yeniden hesapla
  window.addEventListener('resize', function () {
    stopCarousel();
    const width = parseFloat(getComputedStyle(items[0]).width);
    setupCarousel(width);
  });

  // Prev / Next navigation
  function setupNavigation() {
    carousel_btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const target = e.target;

      if (!target.classList.contains('btn')) return;

      if (target.classList.contains('next')) {
        currIndex++;
      } else if (target.classList.contains('prev')) {
        currIndex--;
      }

      stopCarousel();
      scene.style.transform = "rotateY(" + (currIndex * -theta) + "rad)";

      if (autoCarousel === "true") {
        setTimeout(setCarouselInterval, 3000);
      }
    });
  }

  // Stop / Restart / Update
  function setupControlButtons() {
    const pauseBtn = document.getElementById('pauseCarousel');
    const resumeBtn = document.getElementById('resumeCarousel');
    const updateBtn = document.getElementById('updateCarousel');

    const uploader = document.getElementById('uploader');
    const carouselEl = document.getElementById('carousel');
    const sceneEl = document.getElementById('scene');
    const fileInput = document.getElementById('imageInput');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        stopCarousel();
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', function () {
        if (autoCarousel === "true") {
          setCarouselInterval();
        }
      });
    }

    if (updateBtn) {
      updateBtn.addEventListener('click', function () {
        // Carousel'i durdur, sahneyi temizle, tekrar uploader ekranına dön
        stopCarousel();
        sceneEl.innerHTML = '';
        carouselEl.style.display = 'none';
        uploader.style.display = 'block';
        fileInput.value = ''; // seçilmiş dosyaları sıfırla
      });
    }
  }

  setupNavigation();
  setupControlButtons();
}

/* ==== VIDEO KAYIT KONTROLLERİ ==== */

function setupRecordingControls() {
  const startBtn = document.getElementById('startRecord');
  const stopBtn = document.getElementById('stopRecord');

  if (!startBtn || !stopBtn) return;

  let mediaRecorder = null;
  let recordedChunks = [];

  startBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Screen recording is not supported in this browser.');
      return;
    }

    try {
      // Kullanıcıdan ekran/sekme seçmesini ister
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false
      });

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp9'
      });

      recordedChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'carousel-recording.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      mediaRecorder.start();

      startBtn.disabled = true;
      stopBtn.disabled = false;

      stopBtn.onclick = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        stream.getTracks().forEach(t => t.stop());
        startBtn.disabled = false;
        stopBtn.disabled = true;
      };

    } catch (err) {
      console.error(err);
      alert('Could not start screen recording: ' + err.message);
    }
  });
}
