$('#chat_room_view').hide();
$('#nickname_select_view').show();

var sock = io();

// Settings variables
var show_users_typing = true;
var dynamic_message_background_colors = true;
var show_active_users = true;
// Set the settings variables
sock.on('settings', (data) => {
    show_users_typing = data.showUsersTyping;
    dynamic_message_background_colors = data.DynamicMessageBGColors;
    show_active_users = data.showActiveUsers;

    if(!show_active_users) {
        $('#users_nav').hide();
        $('.topNavActiveUsersButton').hide();
    }
});

// Executes when a message is recieved
sock.on('msg', onMessage);
// Executes when a server message is recieved
sock.on('servermsg', onServerMessage);

// If show users typing is enabled, show who is typing
if(show_users_typing) {
    // Executes every x seconds - set in server.js
    sock.on('user_typing_func', (data) => {
        // If someone is typing
        if(data.isTyping) {

            // <Grammar Check>
            if(data.users.length > 1) {
                $('#user_typing_annotation').html(data.users + ' are typing...');
            } else {
                $('#user_typing_annotation').html(data.users + ' is typing...');
            }
            // </Grammar Check>

            // Show the text
            $('#user_typing_annotation').show();
        // If someone is NOT typing
        } else {
            // Hide the text
            $('#user_typing_annotation').hide();
        }
    });
}


if(show_active_users) {
    // Executes when server tells users the active users
    sock.on('active users', (data) => {
        $('#mobile_active_users').empty();
        $('#desktop_active_users').empty();
        data.forEach(function(element) {
            // MOBILE
            $('#mobile_active_users').append($('<p id="active_user">').html(element));

            // DESKTOP
            $('#desktop_active_users').append($('<p id="active_user">').html(element));
        }, this);
    });
}


// Executes when a message is recieved
function onMessage(msg, nick) {
    // Remove all html tags and un-needed spaces
    msg = sanitize(msg);
    // Style the message
    var message = '<span style="font-weight: bold">' + nick + '</span><br/><span style="color: #ffffff">' + msg + '</span>';
    // Make the welcome message text grey
    $('#chat_log ul li:first-child').css("color", "grey");

    // If dynamic message background colors is enabled, dynamically change the colors
    if(dynamic_message_background_colors) {
        // If the previous message nickname is not the current message nickname
        if(prevMessageNick != nick) {
            // Switch the color
            switchColor();
            // Show the message and get the background color
            $('#messages').append($('<li>').html(message).css("background-color", getCurrentColor()));
        }           
       
        // If the previous message nickname is the current message nickname
        if(prevMessageNick == nick) {
            // Show the message and get the background color
            $('#messages').append($('<li>').html(message).css("background-color", getCurrentColor()));
            // Change the previous message color to the current color
            // (redundancy)
            $('#chat_log ul li:last-child').prev().css("background-color", getCurrentColor());
        }
    } else {
        // If dynamic message background colors is disabled,
        // change the color for every message
        $('#messages').append($('<li>').html(message)); // <- Shows user the message
        $('#chat_log ul li:nth-child(even)').css("background-color", "rgba(0, 0, 0, 0.25)"); // <- Changes the color
    }

    // Keep your view at the newest recieved message
    $('body').animate({ scrollTop: $('#messages').height() }, 100);

    // Set the previous message nickname - 
    // Only affected if dynamic message background colors is enabled
    prevMessageNick = nick;

}

if(dynamic_message_background_colors) {

    // Stores the previously recieved message nickname
    var prevMessageNick = "";

    // Stores the current color
    // It's a boolean since there are only two
    // !
    // TRUE == transparent;
    // FALSE = rgba(0, 0, 0, 0.25);
    // !
    var currentcolor = true;
    // Switches the color
    function switchColor() {
        // If the color is true, set it false
        // If the color is false, set it true
        if(currentcolor) {
            currentcolor = false;
        } else {
            currentcolor = true;
        }
    }

    // Returns the current color
    function getCurrentColor() {
        // If it's true, return transparent;
        // If it's false, return rgba(0, 0, 0, 0,25);
        if(currentcolor) {
            return 'transparent';
        } else {
            return 'rgba(0, 0, 0, 0.25)';
        }
    }

}

// When a server message is recieved
function onServerMessage(msg) {
    // Style the message
    var message = '<span style="color: red">' + msg + '</span>';
    // Show user the message
    $('#messages').append($('<li>').html(message));

    // Keep your view at the newest recieved message
    $('body').animate({ scrollTop: $('#messages').height() }, 100);
}

// Executes if show users typing is enabled
if(show_users_typing) {

    // Stores a variable if the we already
    // broadcasted, that we stopped/started typing
    var broadcasted_typing = false;

    // Runs user typing check every x miliseconds
    setInterval(function() {
        check_if_typing();
    }, 500);

    // Checks if the user is typing
    function check_if_typing() {

        // check if the length is 0 - nothing is typed
        if(jQuery.trim( $('#message_input_bottom').val() ).length != 0) {

            // If we have not broadcasted the current
            // status, broadcast it
            if(!broadcasted_typing)
                // Tell the server we are typing
                sock.emit('user typing', true);
            // Tell the variable, we are typing
            broadcasted_typing = true;

        } else {

            // If we have broadcasted the current
            // status, don't broadcast it again
            if(broadcasted_typing)
                // Tell the server we are not typing
                sock.emit('user typing', false);
            // Tell the variable, we are not typing
            broadcasted_typing = false;

        }

    }

}

sock.on('nickname_check_response', (response) => {
    if(response.avalible) {
        // Nickname avalible
        // Set the nickname, show the chat room
        set_nickname(response.nickname);
        return;
    } else {
        // Nickname taken
        // Disable input for 1 second for security reasons
        $('#server_nickname_input').attr('disabled', 'disabled');
        setTimeout(function() {
            $('#server_nickname_input').removeAttr('disabled');
        }, 1000);
        return;
    }
});

function set_nickname(nickname) {

    // Tell the server our nickname
    sock.emit('set nickname', nickname);
    // Show the chat room
    $('#chat_room_view').show();
    // Hide the nickname input
    $('#nickname_select_view').hide();
}

// Run when any key is pressed
$(document).keydown(function(e) {


// If enter is pressed and message_input_bottom is focused
if(e.which == 13 && $('#message_input_bottom').is(":focus")) {
    // If we have nothing typed, deny message send
    if(jQuery.trim( $('#message_input_bottom').val() ).length == 0) {
        return;
    }
    // Run the send message function
    sendMessage();
    return;
}

// If enter is pressed and server_nickname_input is focused
if(e.which == 13 && $('#server_nickname_input').is(":focus")) {
    // If the input is valid (not null)
    if($('#server_nickname_input').is(":valid")) {
        // Get the nickname text
        var inputVal = $('#server_nickname_input').val();
        // Remove un-needed spaces before and after the string
        inputVal = $.trim(inputVal);
        // Sanitize the string (removing all html tags)
        inputVal = sanitize(inputVal);
        // Remove all spaces
        inputVal = inputVal.replace(/\s/g,'');

        // Tell the server to check if nickname is avalible
        sock.emit('check_nickname', inputVal);
    }
}

// If a key other than enter is pressed
if(e.which != 13) {
    // If we are in the chat room
    if($('#chat_room_view').is(":visible")) {
        // Focus the message input, so
        // we can immediately start typing
        $('#message_input_bottom').focus();
    }
    // If we are choosing our nickname
    if($('#nickname_select_view').is(":visible")) {
        // Focus the message input, so
        // we can immediately start typing
        $('#server_nickname_input').focus();
    }
}
    
});

// Send our message to the server
function sendMessage() {
    // Tells the server our message
    sock.emit('msg', $('#message_input_bottom').val());
    // Empty the message input field
    $('#message_input_bottom').val('');
}



// Text sanitization code - Not commented

var protos = document.body.constructor === window.HTMLBodyElement;
    validHTMLTags  =/^(?:a|abbr|acronym|address|applet|area|article|aside|audio|b|base|basefont|bdi|bdo|bgsound|big|blink|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|isindex|kbd|keygen|label|legend|li|link|listing|main|map|mark|marquee|menu|menuitem|meta|meter|nav|nobr|noframes|noscript|object|ol|optgroup|option|output|p|param|plaintext|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|spacer|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)$/i;

function sanitize(txt) {
    var // This regex normalises anything between quotes
        normaliseQuotes = /=(["'])(?=[^\1]*[<>])[^\1]*\1/g,
        normaliseFn = function ($0, q, sym) { 
            return $0.replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
        },
        replaceInvalid = function ($0, tag, off, txt) {
            var 
                // Is it a valid tag?
                invalidTag = protos && 
                    document.createElement(tag) instanceof HTMLUnknownElement
                    || !validHTMLTags.test(tag),

                // Is the tag complete?
                isComplete = txt.slice(off+1).search(/^[^<]+>/) > -1;

            return invalidTag || !isComplete ? '&lt;' + tag : $0;
        };

    txt = txt.replace(normaliseQuotes, normaliseFn)
             .replace(/<(\w+)/g, replaceInvalid);

    var tmp = document.createElement("DIV");
    tmp.innerHTML = txt;

    return "textContent" in tmp ? tmp.textContent : tmp.innerHTML;
}

if(show_active_users) {
    function open_users_nav() {
        document.getElementById("users_nav").style.width = "280px";
    }

    function close_users_nav() {
        document.getElementById("users_nav").style.width = "0";
    }
}