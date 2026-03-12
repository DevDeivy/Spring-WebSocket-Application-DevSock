'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var usernameInput = document.querySelector('#name');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connecting = document.querySelector('.connecting');

//websocket
var stomp = null;
var username = null;

function connect(event) {
    username = usernameInput.value.trim();
    if(username){
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stomp = Stomp.over(socket);
        stomp.connect({}, onConnect, onError);
    }
    event.preventDefault();
}

function onConnect() {
    //subscribe to the public topic
    stomp.subscribe('/topic/public', onMessageReceived);
    //tell username to the server
    stomp.send('/app/chat.addUser', {}, JSON.stringify({sender: username, type: 'JOIN'}));
    connecting.classList.add('hidden');
}

function onMessageReceived(payload){
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style.backgroundColor = '#ccc';

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function onError(){
    connecting.textContent = 'Error connecting to server';
    connecting.style.color = 'red';
}


usernameForm.addEventListener('submit', connect, true)

messageForm.addEventListener('submit', sendMessage, true)

function sendMessage(event){

    var message = messageInput.value.trim();
    if(message && stomp){
        var chatMessage = {
            sender: username,
            content: message,
            type: 'CHAT'
        };

        stomp.send('/app/chat.sendMessage', {}, JSON.stringify(chatMessage));
    }
    messageInput.value = '';

    event.preventDefault();
}