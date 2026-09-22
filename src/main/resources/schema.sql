create table boardgames (
  id       LONG NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name    VARCHAR(128) NOT NULL,
  level   INT NOT NULL,
  minPlayers INT NOT NULL,
  maxPlayers VARCHAR(50) NOT NULL,
  gameType VARCHAR(50) NOT NULL
);

create table reviews (
  id       LONG NOT NULL PRIMARY KEY AUTO_INCREMENT,
  gameId   LONG NOT NULL,	
  text     VARCHAR(1024) NOT NULL UNIQUE
);


alter table reviews
  add constraint game_review_fk foreign key (gameId)
  references boardgames (id);

insert into boardgames (name, level, minPlayers, maxPlayers, gameType)
values ('Tic-Tac-Toe', 1, 2, '2', 'Classic');
 
insert into boardgames (name, level, minPlayers, maxPlayers, gameType)
values ('Connect Four', 2, 2, '2', 'Strategy'); 

insert into boardgames (name, level, minPlayers, maxPlayers, gameType)
values ('Memory Match', 2, 1, '1', 'Puzzle'); 

insert into boardgames (name, level, minPlayers, maxPlayers, gameType)
values ('Rock Paper Scissors', 1, 1, '2', 'Arcade'); 

insert into boardgames (name, level, minPlayers, maxPlayers, gameType)
values ('Number Guess', 1, 1, '1', 'Brain Game'); 
 
insert into reviews (gameId, text)
values (1, 'Fast and fun. Perfect for quick matches.');

insert into reviews (gameId, text)
values (1, 'Simple rules and a good warm-up game before other matches.');

insert into reviews (gameId, text)
values (2, 'Connect Four has strong strategy and is easy to start.');
 
insert into reviews (gameId, text)
values (3, 'Memory Match is great for focus and pattern recall.');

