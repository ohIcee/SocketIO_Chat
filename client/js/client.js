$('#chat_room_view').hide();
$('#nickname_select_view').show();

var sock = io();

sock.on('msg', onMessage);
sock.on('servermsg', onServerMessage);

function onMessage(msg, nick) {
    msg = sanitize(msg);
    var message = '<span style="font-weight: bold">' + nick + '</span><br/><span style="color: #ffffff">' + msg + '</span>';
    var temp = $('#messages').append($('<li>').html(message));

    $('body').animate({ scrollTop: $('#messages').height() }, 100);
}

function onServerMessage(msg) {
    var message = '<span style="color: red">' + msg + '</span>';
    $('#messages').append($('<li>').html(message));

    $('body').animate({ scrollTop: $('#messages').height() }, 100);
}

// Run when any key is pressed
$(document).keydown(function(e) {

// If enter is pressed and message_input_bottom is focused
if(e.which == 13 && $('#message_input_bottom').is(":focus")) {
    if(jQuery.trim( $('#message_input_bottom').val() ).length == 0) {
        return;
    }
    sendMessage();
    return;
}

// If enter is pressed and server_join_input is focused
if(e.which == 13 && $('#server_nickname_input').is(":focus")) {
    if($('#server_nickname_input').is(":valid")) {
        var inputVal = $('#server_nickname_input').val();
        sock.emit('set nickname', inputVal);
        $('#chat_room_view').show();
        $('#nickname_select_view').hide();
        return;
    } else {
        return;
    }
}

// If a key other than enter is pressed
if(e.which != 13) {
    if($('#chat_room_view').is(":visible")) {
        $('#message_input_bottom').focus();
    }
    if($('#nickname_select_view').is(":visible")) {
        $('#server_nickname_input').focus();
    }
}
    
});

function sendMessage() {
    sock.emit('msg', $('#message_input_bottom').val());
    $('#message_input_bottom').val('');
}

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