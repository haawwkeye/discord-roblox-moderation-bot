let chatStarted = false;

function startChat(users)
{
  if (chatStarted) return;
  chatStarted = true;
  startChat = null;

  $(function() {
      const FADE_TIME = 150; // ms
      const TYPING_TIMER_LENGTH = 400; // ms
    
      // Initialize variables
      const $window = $(window);
      const $messages = $('#messages');           // Messages area
      const $inputMessage = $('#chatInput');   // Input message input box

      let currentRoom = "General";
    
      const socket = io();
    
      // Prompt for setting a username
      // let username = userInfo.Username;
      let connected = false;
      let typing = false;
      let lastTypingTime;
      let $currentInput = $inputMessage;

      const addParticipantsMessage = (data) => {
        let message = '';
        if (data.numUsers === 1) {
          message += `there's 1 user online`;
        } else {
          message += `there's ${data.numUsers} users online`;
        }
        log(message);
      }
    
      // Sends a chat message
      const sendMessage = () => {
        let message = $inputMessage.val();
        // Prevent markup from being injected into the message
        // message = escapeHtml(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
          $inputMessage.val('');
          let newData = userInfo;
          newData.message = message;
          addChatMessage(newData);
          // tell server to execute 'new message' and send along one parameter
          if (currentRoom === "General") socket.emit('new message', message);
          else socket.emit("private message", {
            UserId: userInfo.UserId,
            toUserId: currentRoom,
            message: message
          });
        }
      }
    
      // Log a message
      const log = (message, options) => {
        const $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
      }
    
      //This clears the chat as you can probably guess...
      const clearChat = () => {
        return $messages.children().each((_, elem) => {
          $(elem).remove();
        });
      }

      // Adds the visual chat message to the message list
      const addChatMessage = (data, options = {}) => {
        // Don't fade the message in if there is an 'X was typing'
        const $typingMessages = getTypingMessages(data);
        if ($typingMessages.length !== 0) {
          options.fade = false;
          $typingMessages.remove();
        }
    
        const $usernameDiv = $('<span class="User" data-rank="'+ getRank(data) +'"/> ')
          .text(data.Username + " ");
        const $messageBodyDiv = $('<span class="messageBody">')
          .text(data.message);
    
        const typingClass = data.typing ? 'typing' : '';
        const $messageDiv = $('<li class="message"/>')
          .data('username', data.Username)
          .addClass(typingClass)
          .append($usernameDiv, $messageBodyDiv);
    
        addMessageElement($messageDiv, options);
      }
    
      // Adds the visual chat typing message
      const addChatTyping = (data) => {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
      }
    
      // Removes the visual chat typing message
      const removeChatTyping = (data) => {
        getTypingMessages(data).fadeOut(function () {
          $(this).remove();
        });
      }
    
      // Adds a message element to the messages and scrolls to the bottom
      // el - The element to add as a message
      // options.fade - If the element should fade-in (default = true)
      // options.prepend - If the element should prepend
      //   all other messages (default = false)
      const addMessageElement = (el, options) => {
        const $el = $(el);
        // Setup default options
        if (!options) {
          options = {};
        }
        if (typeof options.fade === 'undefined') {
          options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
          options.prepend = false;
        }
    
        // Apply options
        if (options.fade) {
          $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
          $messages.prepend($el);
        } else {
          $messages.append($el);
        }
    
        // $messages[0].scrollTop = $messages[0].scrollHeight;
      }
    
      // Prevents input from having injected markup
      // const cleanInput = (input) => {
      //   return $('<div/>').text(input).html();
      // }
    
      // Updates the typing event
      const updateTyping = () => {
        if (connected) {
          if (!typing) {
            typing = true;
            socket.emit('typing', currentRoom);
          }
          lastTypingTime = (new Date()).getTime();
    
          setTimeout(() => {
            const typingTimer = (new Date()).getTime();
            const timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
              socket.emit('stop typing', currentRoom);
              typing = false;
            }
          }, TYPING_TIMER_LENGTH);
        }
      }
    
      // Gets the 'X is typing' messages of a user
      const getTypingMessages = (data) => {
        return $('.typing.message').filter(function (i) {
          return $(this).data('username') === data.Username;
        });
      }

      const setRoom = (roomId) => {
        currentRoom = roomId;
        // $chat.data("room", roomId);
        socket.emit("join room", roomId);
        socket.emit("roomData"); // Get the data for the current room
      }
    
      // Keyboard events
    
      let chatTabs = $("#tabs");
      let tabs = chatTabs.children();
      let $currentTab;

      let onTabClicked = (elem) => {
        let tab = $(elem);

        $currentInput.focus();

        if (tab.hasClass("active")) return;
        if ($currentTab) $currentTab.removeClass("active");
        
        $currentTab = tab;
        $currentTab.addClass("active");
        
        setRoom($currentTab.data("room"));
      }

      function createTab(user)
      {
        // when user is set to self it kinda breaks...
        if (user === null || userInfo.UserId === user.UserId) return;

        let btn = $("<button/>").append(user.Username);
        let tab = $(`<li class="tab" data-room="${user.UserId}"/>`).append(btn);

        chatTabs.append(tab);

        addTab(tab[0]);
      }

      function addTab(tab)
      {        
        tab.onclick = () => {
          onTabClicked(tab);
        }
      }

      (async()=>{
        tabs.each((_, elem) => {
          let tab = $(elem);
          if (tab.hasClass("active")) $currentTab = tab;
          addTab(elem);
        });

        for (const i in users) {
          createTab(user[i]);
        }
      })();

      $window.keydown(event => {
        // Auto-focus the current input when a key is typed
        // removed this as we will end up having more then one input and I don't wanna see if
        // that works or not Lol
        // if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        //   $currentInput.focus();
        // }
        // When the client hits ENTER on their keyboard
        if (event.which === 13 && ($currentInput.is(":focus"))) {
          sendMessage();
          socket.emit('stop typing', currentRoom);
          typing = false;
        }
      });
    
      $inputMessage.on('input', () => {
        updateTyping();
      });
    
      // Click events
    
      // Focus input when clicking on the message input's border
      $inputMessage.click(() => {
        $inputMessage.focus();
      });
    
      // Socket events
    
      // Whenever the server emits 'login', log the login message
      socket.on('login', () => {
        connected = true;
        socket.emit("roomData"); // Get the data for the current room
      });

      socket.on("roomData", (roomData) => {
        // Display the welcome message
        // console.log(roomData)
        (async () => {
          await clearChat();
          await roomData.messages.forEach((msgData) => {
            addChatMessage(msgData);
          });
          addParticipantsMessage(roomData);
        })();
      })
    
      // Whenever the server emits 'new message', update the chat body
      socket.on('new message', (data) => {
        addChatMessage(data);
      });

      socket.on('private message', (data) => {
        addChatMessage(data);
      })
    
      // Whenever the server emits 'user joined', log it in the chat body
      socket.on('user joined', (data) => {
        createTab(data);
        log(`${data.Username} joined`);
        addParticipantsMessage(data);
      });
    
      // Whenever the server emits 'user left', log it in the chat body
      socket.on('user left', (data) => {
        log(`${data.Username} left`);
        addParticipantsMessage(data);
        removeChatTyping(data);
      });
    
      // Whenever the server emits 'typing', show the typing message
      socket.on('typing', (data) => {
        addChatTyping(data);
      });
    
      // Whenever the server emits 'stop typing', kill the typing message
      socket.on('stop typing', (data) => {
        removeChatTyping(data);
      });
    
      socket.on('disconnect', () => {
        connected = false;
        log('you have been disconnected');
      });
    
      socket.io.on('reconnect', () => {
        log('you have been reconnected');
        if (userInfo) {
          connected = true;
          socket.emit('add user', userInfo);
        }
      });
    
      socket.io.on('reconnect_error', () => {
        connected = false;
        log('attempt to reconnect has failed');
      });

      if (userInfo && !connected) {
        connected = true;
        socket.emit('add user', userInfo);
      }
  });
}
