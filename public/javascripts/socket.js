// Establish socket connection
var socket = io.connect('http://localhost:8080');

// Deliver message to the server confirming the connection
socket.on('connected', function (data) {
    console.log(data);
    socket.emit('confirmConnection', 'Someone connected to the server!');
});

// Render the chat messages on the DOM
socket.on('output', function (data) {
    if (data.length) {
        for (var i = 0; i < data.length; i++) {
            var content = data[i].name + ': ' + data[i].message;
            var div = '<div class="chat-message">' + content + '</div>';
            $('.chat-messages').append(div);
        }
    }
});

// Change the user's chat status
var statusDefault = $('.chat-status span').text();
var $status = $('.chat-status span');

function setStatus (s) {
    $status.html(s);

    // Change a user's status back to idle after 3 seconds of inaction
    if (s !== statusDefault) {
        var delay = setTimeout(function() {
            setStatus(statusDefault);
            clearInterval(delay);
        }, 3000);
    }
};

// Add event listener to send the message when the user hits 'enter'
if (socket !== undefined) {

    var $textArea = $('.chat-textarea');

    socket.on('status', function(data) {
        setStatus((typeof data === 'object') ? data.message : data);

        if (data.clear === true) {
            $textArea.val('');
        }
    });

    $textArea.on('keydown', function (e) {

        // 13 represents 'enter' on the keyboard.
        if(e.which === 13) {
            var name = $('.chat-name').val();
            var message = this.value;

            // Send the message to the server
            socket.emit('toServer', {
                name: name,
                message: message
            });

            e.preventDefault();
        }
    }); 
}