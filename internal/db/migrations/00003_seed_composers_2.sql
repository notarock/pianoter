-- +goose Up
INSERT INTO composers (user_id, name, nationality, born_year, died_year) VALUES
(0, 'Erik Satie',                  'French',    1866, 1925),
(0, 'Béla Bartók',                 'Hungarian', 1881, 1945),
(0, 'Arnold Schoenberg',           'Austrian',  1874, 1951),
(0, 'Alban Berg',                  'Austrian',  1885, 1935),
(0, 'Anton Bruckner',              'Austrian',  1824, 1896),
(0, 'Alexander Scriabin',          'Russian',   1872, 1915),
(0, 'Nikolai Rimsky-Korsakov',     'Russian',   1844, 1908),
(0, 'Modest Mussorgsky',           'Russian',   1839, 1881),
(0, 'Olivier Messiaen',            'French',    1908, 1992),
(0, 'Francis Poulenc',             'French',    1899, 1963),
(0, 'Darius Milhaud',              'French',    1892, 1974),
(0, 'Paul Hindemith',              'German',    1895, 1963),
(0, 'Carl Orff',                   'German',    1895, 1982),
(0, 'Max Reger',                   'German',    1873, 1916),
(0, 'Gustav Holst',                'English',   1874, 1934),
(0, 'Frederick Delius',            'English',   1862, 1934),
(0, 'William Walton',              'English',   1902, 1983),
(0, 'George Gershwin',             'American',  1898, 1937),
(0, 'Aaron Copland',               'American',  1900, 1990),
(0, 'Samuel Barber',               'American',  1910, 1981),
(0, 'Leonard Bernstein',           'American',  1918, 1990),
(0, 'Scott Joplin',                'American',  1868, 1917),
(0, 'Ottorino Respighi',           'Italian',   1879, 1936),
(0, 'Heitor Villa-Lobos',          'Brazilian', 1887, 1959),
(0, 'Alberto Ginastera',           'Argentine', 1916, 1983),
(0, 'Karol Szymanowski',           'Polish',    1882, 1937),
(0, 'Aram Khachaturian',           'Armenian',  1903, 1978),
(0, 'Bohuslav Martinů',            'Czech',     1890, 1959);

-- +goose Down
DELETE FROM composers WHERE user_id = 0 AND name IN (
  'Erik Satie', 'Béla Bartók', 'Arnold Schoenberg', 'Alban Berg', 'Anton Bruckner',
  'Alexander Scriabin', 'Nikolai Rimsky-Korsakov', 'Modest Mussorgsky',
  'Olivier Messiaen', 'Francis Poulenc', 'Darius Milhaud', 'Paul Hindemith',
  'Carl Orff', 'Max Reger', 'Gustav Holst', 'Frederick Delius', 'William Walton',
  'George Gershwin', 'Aaron Copland', 'Samuel Barber', 'Leonard Bernstein',
  'Scott Joplin', 'Ottorino Respighi', 'Heitor Villa-Lobos', 'Alberto Ginastera',
  'Karol Szymanowski', 'Aram Khachaturian', 'Bohuslav Martinů'
);
