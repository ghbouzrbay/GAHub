document.getElementById('fileInput').addEventListener('change', function(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
   
    reader.onload = function(e) {
       var img = document.createElement('img');
       img.src = e.target.result;
       document.getElementById('preview').appendChild(img);
    };
   
    reader.readAsDataURL(file);
   
    // Reset the file input value
    e.target.value = '';
   });
