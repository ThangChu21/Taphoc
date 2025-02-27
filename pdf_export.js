// Chức năng xuất PDF nâng cao
(function() {
    // Khởi tạo các biến
    let pdfExportBtn;
    let pdfOptionsPanel;
    let pdfPageSize;
    let pdfMargin;
    let pdfFontSize;
    let pdfOrientation;
    
    // Thêm vào DOM sau khi Just Read được khởi động
    function initPDFExport() {
        if(document.getElementById('simple-article')) {
            const iframe = document.getElementById('simple-article').contentWindow.document;
            
            // Tìm nút in hiện có
            const printBtn = iframe.querySelector('.simple-print');
            if(!printBtn) {
                setTimeout(initPDFExport, 500);
                return;
            }
            
            // Tạo nút xuất PDF mới
            pdfExportBtn = printBtn.cloneNode(true);
            pdfExportBtn.classList.add('pdf-export-btn');
            pdfExportBtn.title = 'Xuất PDF với tùy chỉnh';
            
            // Thêm SVG mới cho nút PDF
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M20,2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M20,16H8V4h12V16z M4,6H2v14c0,1.1,0.9,2,2,2h14v-2H4V6z M16,12v-2c0-1.11-0.9-2-2-2h-4v8h4C15.1,16,16,15.1,16,14v-2z M14,14h-2v-4h2v2v2z");
            svg.appendChild(path);
            
            // Xóa nội dung cũ của nút
            while(pdfExportBtn.firstChild) {
                pdfExportBtn.removeChild(pdfExportBtn.firstChild);
            }
            
            pdfExportBtn.appendChild(svg);
            
            // Thêm nút vào giao diện
            printBtn.parentNode.insertBefore(pdfExportBtn, printBtn.nextSibling);
            
            // Tạo panel tùy chọn xuất PDF
            pdfOptionsPanel = document.createElement('div');
            pdfOptionsPanel.className = 'pdf-export-options';
            pdfOptionsPanel.innerHTML = `
                <h3>Tùy chỉnh xuất PDF</h3>
                <label>
                    Kích thước trang:
                    <select id="pdf-page-size">
                        <option value="a4" selected>A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                    </select>
                </label>
                <label>
                    Hướng trang:
                    <select id="pdf-orientation">
                        <option value="portrait" selected>Dọc</option>
                        <option value="landscape">Ngang</option>
                    </select>
                </label>
                <label>
                    Lề (mm):
                    <input type="number" id="pdf-margin" value="10" min="0" max="50">
                </label>
                <label>
                    Cỡ chữ:
                    <input type="number" id="pdf-font-size" value="12" min="8" max="24">
                </label>
                <button id="export-pdf-button">Xuất PDF</button>
                <button id="cancel-pdf-button">Hủy</button>
            `;
            
            iframe.body.appendChild(pdfOptionsPanel);
            
                   // Lấy reference đến các phần tử trong panel
            pdfPageSize = iframe.getElementById('pdf-page-size');
            pdfOrientation = iframe.getElementById('pdf-orientation');
            pdfMargin = iframe.getElementById('pdf-margin');
            pdfFontSize = iframe.getElementById('pdf-font-size');
            
            // Thêm sự kiện cho nút xuất PDF
            pdfExportBtn.addEventListener('click', function() {
                pdfOptionsPanel.classList.toggle('active');
            });
            
            // Thêm sự kiện nút xuất PDF trong panel
            iframe.getElementById('export-pdf-button').addEventListener('click', function() {
                // Áp dụng các tùy chọn
                applyPDFStyles(iframe);
                
                // Đóng panel tùy chọn
                pdfOptionsPanel.classList.remove('active');
                
                // Xuất PDF
                setTimeout(function() {
                    iframe.defaultView.print();
                    
                    // Khôi phục kiểu dáng sau khi xuất
                    setTimeout(function() {
                        restorePDFStyles(iframe);
                    }, 1000);
                }, 300);
            });
            
            // Thêm sự kiện nút hủy
            iframe.getElementById('cancel-pdf-button').addEventListener('click', function() {
                pdfOptionsPanel.classList.remove('active');
            });
        } else {
            setTimeout(initPDFExport, 500);
        }
    }
    
    // Áp dụng kiểu dáng cho PDF
    function applyPDFStyles(doc) {
        // Lưu kiểu dáng hiện tại để khôi phục sau
        if (!doc.savedStyles) {
            doc.savedStyles = {
                fontSize: doc.querySelector('.jr-body').style.fontSize,
                bodyPadding: doc.querySelector('.jr-body').style.padding
            };
        }
        
        // Áp dụng kiểu dáng mới
        const contentArea = doc.querySelector('.simple-article-container');
        const body = doc.querySelector('.jr-body');
        
        // Cỡ chữ
        if(pdfFontSize && pdfFontSize.value) {
            body.style.fontSize = pdfFontSize.value + 'px';
        }
        
        // Lề
        if(pdfMargin && pdfMargin.value) {
            body.style.padding = pdfMargin.value + 'mm';
        }
        
        // Thêm style cho in ấn
        const printStyle = doc.createElement('style');
        printStyle.id = 'jr-print-styles';
        printStyle.textContent = `
            @page {
                size: ${pdfPageSize ? pdfPageSize.value : 'a4'} ${pdfOrientation ? pdfOrientation.value : 'portrait'};
                margin: ${pdfMargin ? pdfMargin.value + 'mm' : '10mm'};
            }
            @media print {
                .simple-control, .simple-ui-container, .pdf-export-options {
                    display: none !important;
                }
            }
        `;
        
        // Xóa style cũ nếu có
        const oldStyle = doc.getElementById('jr-print-styles');
        if(oldStyle) {
            oldStyle.parentNode.removeChild(oldStyle);
        }
        
        doc.head.appendChild(printStyle);
    }
    
    // Khôi phục kiểu dáng sau khi xuất PDF
    function restorePDFStyles(doc) {
        if(doc.savedStyles) {
            const body = doc.querySelector('.jr-body');
            body.style.fontSize = doc.savedStyles.fontSize;
            body.style.padding = doc.savedStyles.bodyPadding;
            
            // Xóa style in ấn
            const printStyle = doc.getElementById('jr-print-styles');
            if(printStyle) {
                printStyle.parentNode.removeChild(printStyle);
            }
        }
    }
    
    // Khởi động chức năng khi trang đã tải xong
    window.addEventListener('load', function() {
        setTimeout(initPDFExport, 1000);
    });
    
    // Thêm chức năng xuất PDF khi Just Read được khởi động
    const originalCreateSimplifiedOverlay = window.createSimplifiedOverlay;
    if(typeof originalCreateSimplifiedOverlay === 'function') {
        window.createSimplifiedOverlay = function() {
            originalCreateSimplifiedOverlay.apply(this, arguments);
            setTimeout(initPDFExport, 1000);
        };
    }
})();