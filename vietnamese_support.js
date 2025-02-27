// Thêm hỗ trợ Tiếng Việt và phím tắt Alt+I
(function() {
    // Danh sách các văn bản cần được Việt hóa
    const translations = {
        'View this page using Just Read': 'Xem trang này bằng Just Read Việt',
        'Select content to read': 'Chọn nội dung để đọc',
        'View the linked page using Just Read': 'Xem trang liên kết bằng Just Read Việt',
        'Add this site to Just Read\'s auto-run list': 'Thêm trang này vào danh sách tự động chạy của Just Read Việt',
        'Unknown date': 'Ngày không xác định',
        'Unknown author': 'Tác giả không xác định',
        'Unknown title': 'Tiêu đề không xác định',
        'Close Just Read': 'Đóng Just Read Việt',
        'Print article': 'In bài viết',
        'Share article': 'Chia sẻ bài viết',
        'Start/end deletion mode': 'Bật/tắt chế độ xóa nội dung',
        'Edit your theme': 'Chỉnh sửa giao diện',
        'Viewed using': 'Xem bằng',
        'Report an error': 'Báo cáo lỗi',
        'minute read': 'phút đọc',
        'Save and close': 'Lưu và đóng',
        'Close without saving': 'Đóng không lưu',
        'Bold': 'In đậm',
        'Italicize': 'In nghiêng',
        'Underline': 'Gạch chân',
        'Strike-through': 'Gạch ngang',
        'Text color': 'Màu chữ',
        'Highlight color': 'Màu nền',
        'Clear formatting': 'Xóa định dạng',
        'Delete highlighted text': 'Xóa văn bản đã chọn',
        'To annotate this article, upgrade to': 'Để chú thích bài viết này, hãy nâng cấp lên',
        'Premium': 'Phiên bản cao cấp',
        'Summarize article': 'Tóm tắt bài viết'
    };
    
    // Hàm thay thế văn bản trong DOM
    function translateElements() {
        if(document.getElementById('simple-article')) {
            const iframe = document.getElementById('simple-article').contentWindow.document;
            
            // Thay thế các văn bản trong DOM
            for(let [english, vietnamese] of Object.entries(translations)) {
                // Tìm tất cả các phần tử có văn bản này
                const elements = [...iframe.querySelectorAll('*')].filter(el => 
                    el.childNodes.length === 1 && 
                    el.firstChild.nodeType === 3 && 
                    el.textContent.trim() === english
                );
                
                // Thay thế văn bản trong các phần tử
                elements.forEach(el => {
                    el.textContent = vietnamese;
                });
                
                // Thay thế các thuộc tính title
                const withTitle = [...iframe.querySelectorAll('[title="' + english + '"]')];
                withTitle.forEach(el => {
                    el.setAttribute('title', vietnamese);
                });
            }
            
            // Thay đổi phần chân trang
            const viewedUsing = iframe.querySelector('.simple-viewed-using');
            if(viewedUsing) {
                viewedUsing.innerHTML = 'Xem bằng <a href="https://justread.link/" target="_blank">Just Read Việt</a>';
            }
        } else {
            setTimeout(translateElements, 500);
        }
    }
    
    // Thêm phím tắt Alt+I
    function setupAltIShortcut() {
        document.addEventListener('keydown', function(e) {
            // Alt + I
            if(e.altKey && e.key === 'i') {
                // Mở tab mới với cùng URL
                chrome.runtime.sendMessage({ openNewTab: true });
                e.preventDefault();
            }
        });
    }
    
    // Khởi động chức năng khi trang đã tải xong
    window.addEventListener('load', function() {
        setupAltIShortcut();
        
        // Thêm một chờ để đợi Just Read khởi động
        const checkInterval = setInterval(function() {
            if(document.getElementById('simple-article')) {
                clearInterval(checkInterval);
                setTimeout(translateElements, 1000);
            }
        }, 500);
    });
})();