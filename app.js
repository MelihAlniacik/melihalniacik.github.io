document.addEventListener('DOMContentLoaded', () => {
    // State
    let questions = [];
    let currentImageBase64 = null;
    let optionCount = 4; // Start with 4 options (A, B, C, D)

    // DOM Elements
    const qTextInput = document.getElementById('q-text');
    const qImageInput = document.getElementById('q-image');
    const imagePreviewContainer = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImgBtn = document.getElementById('remove-img');
    const optionsContainer = document.getElementById('options-container');
    const addOptionBtn = document.getElementById('add-option-btn');
    const addQBtn = document.getElementById('add-q-btn');
    const questionsList = document.getElementById('questions-list');
    const qCountSpan = document.getElementById('q-count');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // Helper: Convert index to letter (0=A, 1=B, etc.)
    const getLetter = (index) => String.fromCharCode(65 + index);

    // Initialize Options (A, B, C, D)
    const renderOptionsInputs = () => {
        optionsContainer.innerHTML = '';
        for (let i = 0; i < optionCount; i++) {
            const letter = getLetter(i);
            const optDiv = document.createElement('div');
            optDiv.className = 'option-item';
            
            optDiv.innerHTML = `
                <span class="option-label">${letter})</span>
                <input type="text" class="opt-input" data-index="${i}" placeholder="Şık içeriği..." />
                ${i > 1 ? `<button class="remove-option-btn" data-index="${i}"><i class="fas fa-trash"></i></button>` : '<div style="width:24px"></div>'}
            `;
            optionsContainer.appendChild(optDiv);
        }

        // Attach event listeners for remove option buttons
        document.querySelectorAll('.remove-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                removeOption(idx);
            });
        });
    };

    const removeOption = (idx) => {
        // Only allow removing if more than 2 options
        if (optionCount > 2) {
            optionCount--;
            renderOptionsInputs();
        }
    };

    // Add new option
    addOptionBtn.addEventListener('click', () => {
        if (optionCount < 8) { // Max 8 options (H)
            optionCount++;
            renderOptionsInputs();
        }
    });

    // Image Upload Handling
    qImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentImageBase64 = event.target.result;
                previewImg.src = currentImageBase64;
                imagePreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Remove Image
    removeImgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentImageBase64 = null;
        qImageInput.value = '';
        imagePreviewContainer.classList.add('hidden');
        previewImg.src = '';
    });

    // Add Question
    addQBtn.addEventListener('click', () => {
        const text = qTextInput.value.trim();
        const optionInputs = document.querySelectorAll('.opt-input');
        
        // Validation
        if (!text && !currentImageBase64) {
            alert('Lütfen bir soru metni yazın veya görsel ekleyin!');
            return;
        }

        const options = [];
        let hasEmptyOptions = false;
        optionInputs.forEach((input, index) => {
            const val = input.value.trim();
            if(!val) hasEmptyOptions = true;
            options.push({ letter: getLetter(index), text: val });
        });

        const newQuestion = {
            id: Date.now(),
            text: text,
            image: currentImageBase64,
            options: options
        };

        questions.push(newQuestion);
        updateUI();
        resetForm();
    });

    const resetForm = () => {
        qTextInput.value = '';
        currentImageBase64 = null;
        qImageInput.value = '';
        imagePreviewContainer.classList.add('hidden');
        previewImg.src = '';
        optionCount = 4;
        renderOptionsInputs();
    };

    const deleteQuestion = (id) => {
        questions = questions.filter(q => q.id !== id);
        updateUI();
    };

    const updateUI = () => {
        qCountSpan.textContent = questions.length;
        
        if (questions.length === 0) {
            questionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Henüz soru eklenmedi.</p>
                </div>
            `;
            exportPdfBtn.disabled = true;
        } else {
            questionsList.innerHTML = '';
            questions.forEach((q, index) => {
                const qCard = document.createElement('div');
                qCard.className = 'question-card';
                
                let imgHtml = q.image ? `<img src="${q.image}" class="q-image-disp" alt="Soru Görseli">` : '';
                
                let optsHtml = q.options.map(opt => `
                    <div class="q-opt-item">
                        <span class="q-opt-label">${opt.letter})</span>
                        <span>${opt.text || '<span style="color:#666;font-style:italic">Boş</span>'}</span>
                    </div>
                `).join('');

                qCard.innerHTML = `
                    <button class="delete-q-btn" onclick="deleteQuestionHandler(${q.id})"><i class="fas fa-trash"></i></button>
                    <span class="q-number">Soru ${index + 1}</span>
                    <div class="q-text-disp">${q.text}</div>
                    ${imgHtml}
                    <div class="q-options-disp">
                        ${optsHtml}
                    </div>
                `;
                
                questionsList.appendChild(qCard);
            });
            exportPdfBtn.disabled = false;
        }
    };

    // Global wrapper for delete since handler is inline string
    window.deleteQuestionHandler = (id) => {
        deleteQuestion(id);
    };

    // PDF Export Logic
    exportPdfBtn.addEventListener('click', () => {
        if(questions.length === 0) return;

        // Change button state
        const originalText = exportPdfBtn.innerHTML;
        exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PDF Hazırlanıyor...';
        exportPdfBtn.disabled = true;

        // Build clean HTML string for PDF with gorgeous injected styles
        let htmlContent = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
                
                .pdf-root {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                    background: #ffffff;
                    color: #1e293b;
                    font-family: 'Outfit', sans-serif;
                }
                .pdf-header {
                    background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
                    color: white;
                    padding: 25px 30px;
                    border-radius: 16px;
                    margin-bottom: 40px;
                    text-align: center;
                    box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.2);
                    position: relative;
                }
                .pdf-header h1 {
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .pdf-header p {
                    margin: 8px 0 0 0;
                    opacity: 0.9;
                    font-size: 16px;
                    font-weight: 400;
                }
                .question-container {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 30px 30px 30px 40px;
                    position: relative;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .q-badge {
                    position: absolute;
                    left: -20px;
                    top: 25px;
                    background: #ec4899;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 18px;
                    box-shadow: 0 4px 6px rgba(236, 72, 153, 0.4);
                    border: 3px solid white;
                }
                .q-content {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #334155;
                    margin-bottom: 20px;
                    white-space: pre-wrap;
                }
                .q-image {
                    max-width: 100%;
                    max-height: 350px;
                    margin: 15px 0 25px;
                    border-radius: 12px;
                    display: block;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .option-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    background: #f8fafc;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    font-size: 15px;
                    color: #475569;
                }
                .opt-letter {
                    font-weight: 700;
                    color: #7c3aed;
                    background: rgba(124, 58, 237, 0.1);
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    flex-shrink: 0;
                    font-size: 14px;
                }
                .footer-brand {
                    text-align: center;
                    font-size: 14px;
                    color: #94a3b8;
                    margin-top: 50px;
                    border-top: 2px dashed #e2e8f0;
                    padding-top: 25px;
                }
            </style>
            <div class="pdf-root">
                <div class="pdf-header">
                    <h1>Çalışma Kitapçığı</h1>
                    <p>Özel Hazırlanmış Soru Testi</p>
                </div>
        `;

        questions.forEach((q, index) => {
            htmlContent += `
                <div class="question-container">
                    <div class="q-badge">${index + 1}</div>
            `;
            
            if (q.text) {
                htmlContent += `<div class="q-content">${q.text}</div>`;
            }

            if (q.image) {
                htmlContent += `<img src="${q.image}" class="q-image" alt="Soru Görseli">`;
            }

            htmlContent += `<div class="options-grid">`;
            q.options.forEach(opt => {
                if(opt.text) {
                    htmlContent += `
                        <div class="option-item">
                            <span class="opt-letter">${opt.letter}</span>
                            <span>${opt.text}</span>
                        </div>
                    `;
                }
            });
            htmlContent += `</div></div>`;
        });

        htmlContent += `
                <div class="footer-brand">
                    Bu belge otomatik olarak oluşturulmuştur. Başarılar dileriz!
                </div>
            </div>
        `;

        // Generate PDF using html2pdf
        const opt = {
            margin:       15,
            filename:     'sorular_' + new Date().toISOString().split('T')[0] + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(htmlContent).save().then(() => {
            // Restore button state
            exportPdfBtn.innerHTML = originalText;
            exportPdfBtn.disabled = false;
        }).catch(err => {
            console.error("PDF generation failed", err);
            exportPdfBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Hata Oluştu';
            setTimeout(() => {
                exportPdfBtn.innerHTML = originalText;
                exportPdfBtn.disabled = false;
            }, 3000);
        });
    });

    // Initial render
    renderOptionsInputs();
});
