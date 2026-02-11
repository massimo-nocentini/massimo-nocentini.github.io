+++
date = '2026-02-06T09:58:04+01:00'
title = 'Running PostgreSQL natively vs into containers'
subtitle = 'A benchmark against a stress test'
tags = ['postgresql']
summary = ' '
author = ['Massimo Nocentini', 'Richard Uttner']
+++

The results in a nutshell:

|Machine|Runtime|Duration|Duration ratio wrt Machine|Duration per record|Duration per record ratio wrt Machine|
|---|---|---|---|---|---|
|M4 Max|native|137s|1|0.21ms|1
|M4 Max|container|217s|1,5839|0.34ms|1,619
|Debian box|native|611s|1|0.95ms|1
|Debian box|container|974s|1,5941|1.51ms|1,5894


# On a M4 Max

## System report details

- **Model Name:**	MacBook Pro
- **Model Identifier:**	Mac16,5
- **Chip:**	Apple M4 Max
- **Total Number of Cores:**	16 (12 performance and 4 efficiency)
- **Memory:**	128 GB
- **System Firmware Version:**	13822.61.10
- **OS Loader Version:**	13822.61.10

## Running into a container

```
pgbench (18.1)
starting vacuum...end.
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 1
query mode: simple
number of clients: 1
number of threads: 1
maximum number of tries: 1
duration: 5 s
number of transactions actually processed: 3850
number of failed transactions: 0 (0.000%)
latency average = 1.298 ms
initial connection time = 5.704 ms
tps = 770.645801 (without initial connection time)
```
<!-- 
```
NOTICE:  Start execute_story_chunks for total of 642398 at 2026-02-06 15:00:14
NOTICE:  Running full ANALYZE
NOTICE:  Checking duration for 2000 eventstory records after total seconds: 2
NOTICE:  Checking duration for 5000 eventstory records after total seconds: 3
NOTICE:  Checking duration for 10000 eventstory records after total seconds: 5
NOTICE:  Checking duration for 20000 eventstory records after total seconds: 9
NOTICE:  Checking duration for 30000 eventstory records after total seconds: 12
NOTICE:  Checking duration for 40000 eventstory records after total seconds: 15
NOTICE:  Checking duration for 50000 eventstory records after total seconds: 18
NOTICE:  Checking duration for 60000 eventstory records after total seconds: 22
NOTICE:  Checking duration for 70000 eventstory records after total seconds: 25
NOTICE:  Checking duration for 80000 eventstory records after total seconds: 28
NOTICE:  Checking duration for 90000 eventstory records after total seconds: 31
NOTICE:  Checking duration for 100000 eventstory records after total seconds: 35
NOTICE:  Checking duration for 110000 eventstory records after total seconds: 38
NOTICE:  Checking duration for 120000 eventstory records after total seconds: 41
NOTICE:  Checking duration for 130000 eventstory records after total seconds: 45
NOTICE:  Checking duration for 140000 eventstory records after total seconds: 48
NOTICE:  Checking duration for 150000 eventstory records after total seconds: 51
NOTICE:  Checking duration for 160000 eventstory records after total seconds: 55
NOTICE:  Checking duration for 170000 eventstory records after total seconds: 58
NOTICE:  Checking duration for 180000 eventstory records after total seconds: 62
NOTICE:  Checking duration for 190000 eventstory records after total seconds: 65
NOTICE:  Checking duration for 200000 eventstory records after total seconds: 68
NOTICE:  Checking duration for 210000 eventstory records after total seconds: 72
NOTICE:  Checking duration for 220000 eventstory records after total seconds: 75
NOTICE:  Checking duration for 230000 eventstory records after total seconds: 79
NOTICE:  Checking duration for 240000 eventstory records after total seconds: 82
NOTICE:  Checking duration for 250000 eventstory records after total seconds: 86
NOTICE:  Checking duration for 260000 eventstory records after total seconds: 89
NOTICE:  Checking duration for 270000 eventstory records after total seconds: 93
NOTICE:  Checking duration for 280000 eventstory records after total seconds: 96
NOTICE:  Checking duration for 290000 eventstory records after total seconds: 100
NOTICE:  Checking duration for 300000 eventstory records after total seconds: 103
NOTICE:  Checking duration for 310000 eventstory records after total seconds: 106
NOTICE:  Checking duration for 320000 eventstory records after total seconds: 110
NOTICE:  Checking duration for 330000 eventstory records after total seconds: 113
NOTICE:  Checking duration for 340000 eventstory records after total seconds: 116
NOTICE:  Checking duration for 350000 eventstory records after total seconds: 119
NOTICE:  Checking duration for 360000 eventstory records after total seconds: 123
NOTICE:  Checking duration for 370000 eventstory records after total seconds: 126
NOTICE:  Checking duration for 380000 eventstory records after total seconds: 129
NOTICE:  Checking duration for 390000 eventstory records after total seconds: 132
NOTICE:  Checking duration for 400000 eventstory records after total seconds: 136
NOTICE:  Checking duration for 410000 eventstory records after total seconds: 139
NOTICE:  Checking duration for 420000 eventstory records after total seconds: 142
NOTICE:  Checking duration for 430000 eventstory records after total seconds: 146
NOTICE:  Checking duration for 440000 eventstory records after total seconds: 149
NOTICE:  Checking duration for 450000 eventstory records after total seconds: 152
NOTICE:  Checking duration for 460000 eventstory records after total seconds: 155
NOTICE:  Checking duration for 470000 eventstory records after total seconds: 159
NOTICE:  Checking duration for 480000 eventstory records after total seconds: 162
NOTICE:  Checking duration for 490000 eventstory records after total seconds: 165
NOTICE:  Checking duration for 500000 eventstory records after total seconds: 169
NOTICE:  Checking duration for 510000 eventstory records after total seconds: 172
NOTICE:  Checking duration for 520000 eventstory records after total seconds: 175
NOTICE:  Checking duration for 530000 eventstory records after total seconds: 179
NOTICE:  Checking duration for 540000 eventstory records after total seconds: 182
NOTICE:  Checking duration for 550000 eventstory records after total seconds: 185
NOTICE:  Checking duration for 560000 eventstory records after total seconds: 189
NOTICE:  Checking duration for 570000 eventstory records after total seconds: 192
NOTICE:  Checking duration for 580000 eventstory records after total seconds: 195
NOTICE:  Checking duration for 590000 eventstory records after total seconds: 199
NOTICE:  Checking duration for 600000 eventstory records after total seconds: 202
NOTICE:  Checking duration for 610000 eventstory records after total seconds: 206
NOTICE:  Checking duration for 620000 eventstory records after total seconds: 209
NOTICE:  Checking duration for 630000 eventstory records after total seconds: 212
NOTICE:  Checking duration for 640000 eventstory records after total seconds: 216
NOTICE:  Checking story index 642398 by: SELECT chk.check_eventstory_count(expected_count => 642398)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project A', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project B', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project K', expected_j => '[0]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project L', expected_j => '[1]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project M', expected_j => '[1]'::jsonb)
NOTICE:  Last eventid: 642480, last executed storyindex: 642398
NOTICE:  Finished execute_story_chunks at 2026-02-06 15:03:50 for 642398 stories, total duration: 217s (0.34ms per record)
CALL
```
-->

## Running natively

```
pgbench (18.1)
starting vacuum...end.
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 1
query mode: simple
number of clients: 1
number of threads: 1
maximum number of tries: 1
duration: 5 s
number of transactions actually processed: 7858
number of failed transactions: 0 (0.000%)
latency average = 0.636 ms
initial connection time = 2.290 ms
tps = 1572.119114 (without initial connection time)
```

<!-- 
```
NOTICE:  Start execute_story_chunks for total of 642398 at 2026-02-06 14:58:57
NOTICE:  Running full ANALYZE
NOTICE:  Checking duration for 2000 eventstory records after total seconds: 1
NOTICE:  Checking duration for 5000 eventstory records after total seconds: 2
NOTICE:  Checking duration for 10000 eventstory records after total seconds: 3
NOTICE:  Checking duration for 20000 eventstory records after total seconds: 5
NOTICE:  Checking duration for 30000 eventstory records after total seconds: 7
NOTICE:  Checking duration for 40000 eventstory records after total seconds: 9
NOTICE:  Checking duration for 50000 eventstory records after total seconds: 11
NOTICE:  Checking duration for 60000 eventstory records after total seconds: 13
NOTICE:  Checking duration for 70000 eventstory records after total seconds: 15
NOTICE:  Checking duration for 80000 eventstory records after total seconds: 17
NOTICE:  Checking duration for 90000 eventstory records after total seconds: 19
NOTICE:  Checking duration for 100000 eventstory records after total seconds: 22
NOTICE:  Checking duration for 110000 eventstory records after total seconds: 24
NOTICE:  Checking duration for 120000 eventstory records after total seconds: 26
NOTICE:  Checking duration for 130000 eventstory records after total seconds: 28
NOTICE:  Checking duration for 140000 eventstory records after total seconds: 30
NOTICE:  Checking duration for 150000 eventstory records after total seconds: 32
NOTICE:  Checking duration for 160000 eventstory records after total seconds: 34
NOTICE:  Checking duration for 170000 eventstory records after total seconds: 37
NOTICE:  Checking duration for 180000 eventstory records after total seconds: 39
NOTICE:  Checking duration for 190000 eventstory records after total seconds: 41
NOTICE:  Checking duration for 200000 eventstory records after total seconds: 43
NOTICE:  Checking duration for 210000 eventstory records after total seconds: 45
NOTICE:  Checking duration for 220000 eventstory records after total seconds: 47
NOTICE:  Checking duration for 230000 eventstory records after total seconds: 50
NOTICE:  Checking duration for 240000 eventstory records after total seconds: 52
NOTICE:  Checking duration for 250000 eventstory records after total seconds: 54
NOTICE:  Checking duration for 260000 eventstory records after total seconds: 56
NOTICE:  Checking duration for 270000 eventstory records after total seconds: 58
NOTICE:  Checking duration for 280000 eventstory records after total seconds: 60
NOTICE:  Checking duration for 290000 eventstory records after total seconds: 62
NOTICE:  Checking duration for 300000 eventstory records after total seconds: 65
NOTICE:  Checking duration for 310000 eventstory records after total seconds: 67
NOTICE:  Checking duration for 320000 eventstory records after total seconds: 69
NOTICE:  Checking duration for 330000 eventstory records after total seconds: 71
NOTICE:  Checking duration for 340000 eventstory records after total seconds: 73
NOTICE:  Checking duration for 350000 eventstory records after total seconds: 75
NOTICE:  Checking duration for 360000 eventstory records after total seconds: 77
NOTICE:  Checking duration for 370000 eventstory records after total seconds: 79
NOTICE:  Checking duration for 380000 eventstory records after total seconds: 81
NOTICE:  Checking duration for 390000 eventstory records after total seconds: 83
NOTICE:  Checking duration for 400000 eventstory records after total seconds: 85
NOTICE:  Checking duration for 410000 eventstory records after total seconds: 87
NOTICE:  Checking duration for 420000 eventstory records after total seconds: 89
NOTICE:  Checking duration for 430000 eventstory records after total seconds: 91
NOTICE:  Checking duration for 440000 eventstory records after total seconds: 94
NOTICE:  Checking duration for 450000 eventstory records after total seconds: 96
NOTICE:  Checking duration for 460000 eventstory records after total seconds: 98
NOTICE:  Checking duration for 470000 eventstory records after total seconds: 100
NOTICE:  Checking duration for 480000 eventstory records after total seconds: 102
NOTICE:  Checking duration for 490000 eventstory records after total seconds: 104
NOTICE:  Checking duration for 500000 eventstory records after total seconds: 106
NOTICE:  Checking duration for 510000 eventstory records after total seconds: 108
NOTICE:  Checking duration for 520000 eventstory records after total seconds: 110
NOTICE:  Checking duration for 530000 eventstory records after total seconds: 112
NOTICE:  Checking duration for 540000 eventstory records after total seconds: 115
NOTICE:  Checking duration for 550000 eventstory records after total seconds: 117
NOTICE:  Checking duration for 560000 eventstory records after total seconds: 119
NOTICE:  Checking duration for 570000 eventstory records after total seconds: 121
NOTICE:  Checking duration for 580000 eventstory records after total seconds: 123
NOTICE:  Checking duration for 590000 eventstory records after total seconds: 125
NOTICE:  Checking duration for 600000 eventstory records after total seconds: 127
NOTICE:  Checking duration for 610000 eventstory records after total seconds: 130
NOTICE:  Checking duration for 620000 eventstory records after total seconds: 132
NOTICE:  Checking duration for 630000 eventstory records after total seconds: 134
NOTICE:  Checking duration for 640000 eventstory records after total seconds: 136
NOTICE:  Checking story index 642398 by: SELECT chk.check_eventstory_count(expected_count => 642398)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project A', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project B', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project K', expected_j => '[0]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project L', expected_j => '[1]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project M', expected_j => '[1]'::jsonb)
NOTICE:  Last eventid: 642480, last executed storyindex: 642398
NOTICE:  Finished execute_story_chunks at 2026-02-06 15:01:13 for 642398 stories, total duration: 137s (0.21ms per record)
CALL
``` -->

### Installation steps

For the sake of clarity, here the steps for compiling *PostgreSQL **18.1*** from 
[sources](https://ftp.postgresql.org/pub/source/v18.1/postgresql-18.1.tar.bz2) according 
to [the official page](https://www.postgresql.org/docs/current/install-make.html#INSTALL-SHORT-MAKE). 
The configuration command looks a bit complicated (many thanks, [Stack Overflow](https://stackoverflow.com/questions/52510499/the-following-icu-libraries-were-not-found-i18n-required)):

```bash
LDFLAGS="${LDFLAGS} -L`brew --prefix icu4c`/lib" CPPFLAGS="${CPPFLAGS} -I`brew --prefix icu4c`/include" PKG_CONFIG_PATH=`brew --prefix icu4c`/lib/pkgconfig:"$PKG_CONFIG_PATH" ./configure
```
Then the `make` as usual:
```bash
make && sudo make install
```

For the sources in the `contrib` subdirectory:
```bash
cd contrib && make && sudo make install
```
required to have some useful extensions.

The previous command install artifacts into `/usr/local/pgsql`, so add `/usr/local/pgsql/bin` and `/usr/local/pgsql/lib` to your `$PATH`
in order to reach them, respectively. Then initialize a new `pg-data` folder somewhere under your `$HOME`:
```bash
/usr/local/pgsql/bin/initdb -D $HOME/pg-data
```

Before starting the server by:
```bash
/usr/local/pgsql/bin/pg_ctl -D $HOME/pg-data -l logfile start
```
remember to adjust your `$HOME/pg-data/postgresql.conf` by changing `listen_addresses = '*'`
and also add to `$HOME/pg-data/pg_hba.conf` the following line:
```
host    all             all             all                     trust
```
to let the serve accept incoming connections from your network.

# On a Debian Linux box

## System report details

### Hardware Information:
- **Hardware Model:**                              Lenovo ThinkPad T14s Gen 1
- **Memory:**                                      16.0 GiB
- **Processor:**                                   Intel® Core™ i7-10510U × 8
- **Graphics:**                                    Intel® UHD Graphics (CML GT2)
- **Disk Capacity:**                               1.0 TB

### Software Information:
- **Firmware Version:**                            N2YET43W (1.32 )
- **OS Name:**                                     Debian GNU/Linux 13 (trixie)
- **OS Build:**                                    (null)
- **OS Type:**                                     64-bit
- **GNOME Version:**                               48
- **Windowing System:**                            Wayland
- **Kernel Version:**                              Linux 6.12.63+deb13-amd64


## Running into a container
<!-- 
```
NOTICE:  Start execute_story_chunks for total of 642398 at 2026-02-06 08:50:49
NOTICE:  Running full ANALYZE
NOTICE:  Checking duration for 2000 eventstory records after total seconds: 4
NOTICE:  Checking duration for 5000 eventstory records after total seconds: 10
NOTICE:  Checking duration for 10000 eventstory records after total seconds: 19
NOTICE:  Checking duration for 20000 eventstory records after total seconds: 35
NOTICE:  Checking duration for 30000 eventstory records after total seconds: 50
NOTICE:  Checking duration for 40000 eventstory records after total seconds: 64
NOTICE:  Checking duration for 50000 eventstory records after total seconds: 79
NOTICE:  Checking duration for 60000 eventstory records after total seconds: 95
NOTICE:  Checking duration for 70000 eventstory records after total seconds: 110
NOTICE:  Checking duration for 80000 eventstory records after total seconds: 125
NOTICE:  Checking duration for 90000 eventstory records after total seconds: 140
NOTICE:  Checking duration for 100000 eventstory records after total seconds: 156
NOTICE:  Checking duration for 110000 eventstory records after total seconds: 171
NOTICE:  Checking duration for 120000 eventstory records after total seconds: 187
NOTICE:  Checking duration for 130000 eventstory records after total seconds: 202
NOTICE:  Checking duration for 140000 eventstory records after total seconds: 217
NOTICE:  Checking duration for 150000 eventstory records after total seconds: 233
NOTICE:  Checking duration for 160000 eventstory records after total seconds: 248
NOTICE:  Checking duration for 170000 eventstory records after total seconds: 264
NOTICE:  Checking duration for 180000 eventstory records after total seconds: 280
NOTICE:  Checking duration for 190000 eventstory records after total seconds: 295
NOTICE:  Checking duration for 200000 eventstory records after total seconds: 311
NOTICE:  Checking duration for 210000 eventstory records after total seconds: 327
NOTICE:  Checking duration for 220000 eventstory records after total seconds: 343
NOTICE:  Checking duration for 230000 eventstory records after total seconds: 359
NOTICE:  Checking duration for 240000 eventstory records after total seconds: 374
NOTICE:  Checking duration for 250000 eventstory records after total seconds: 390
NOTICE:  Checking duration for 260000 eventstory records after total seconds: 405
NOTICE:  Checking duration for 270000 eventstory records after total seconds: 421
NOTICE:  Checking duration for 280000 eventstory records after total seconds: 436
NOTICE:  Checking duration for 290000 eventstory records after total seconds: 451
NOTICE:  Checking duration for 300000 eventstory records after total seconds: 466
NOTICE:  Checking duration for 310000 eventstory records after total seconds: 480
NOTICE:  Checking duration for 320000 eventstory records after total seconds: 495
NOTICE:  Checking duration for 330000 eventstory records after total seconds: 509
NOTICE:  Checking duration for 340000 eventstory records after total seconds: 524
NOTICE:  Checking duration for 350000 eventstory records after total seconds: 539
NOTICE:  Checking duration for 360000 eventstory records after total seconds: 553
NOTICE:  Checking duration for 370000 eventstory records after total seconds: 568
NOTICE:  Checking duration for 380000 eventstory records after total seconds: 583
NOTICE:  Checking duration for 390000 eventstory records after total seconds: 597
NOTICE:  Checking duration for 400000 eventstory records after total seconds: 612
NOTICE:  Checking duration for 410000 eventstory records after total seconds: 627
NOTICE:  Checking duration for 420000 eventstory records after total seconds: 642
NOTICE:  Checking duration for 430000 eventstory records after total seconds: 657
NOTICE:  Checking duration for 440000 eventstory records after total seconds: 672
NOTICE:  Checking duration for 450000 eventstory records after total seconds: 687
NOTICE:  Checking duration for 460000 eventstory records after total seconds: 702
NOTICE:  Checking duration for 470000 eventstory records after total seconds: 717
NOTICE:  Checking duration for 480000 eventstory records after total seconds: 732
NOTICE:  Checking duration for 490000 eventstory records after total seconds: 746
NOTICE:  Checking duration for 500000 eventstory records after total seconds: 762
NOTICE:  Checking duration for 510000 eventstory records after total seconds: 777
NOTICE:  Checking duration for 520000 eventstory records after total seconds: 791
NOTICE:  Checking duration for 530000 eventstory records after total seconds: 806
NOTICE:  Checking duration for 540000 eventstory records after total seconds: 821
NOTICE:  Checking duration for 550000 eventstory records after total seconds: 836
NOTICE:  Checking duration for 560000 eventstory records after total seconds: 851
NOTICE:  Checking duration for 570000 eventstory records after total seconds: 865
NOTICE:  Checking duration for 580000 eventstory records after total seconds: 880
NOTICE:  Checking duration for 590000 eventstory records after total seconds: 895
NOTICE:  Checking duration for 600000 eventstory records after total seconds: 910
NOTICE:  Checking duration for 610000 eventstory records after total seconds: 925
NOTICE:  Checking duration for 620000 eventstory records after total seconds: 940
NOTICE:  Checking duration for 630000 eventstory records after total seconds: 954
NOTICE:  Checking duration for 640000 eventstory records after total seconds: 969
NOTICE:  Checking story index 642398 by: SELECT chk.check_eventstory_count(expected_count => 642398)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project A', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project B', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project K', expected_j => '[0]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project L', expected_j => '[1]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project M', expected_j => '[1]'::jsonb)
NOTICE:  Last eventid: 642480, last executed storyindex: 642398
NOTICE:  Finished execute_story_chunks at 2026-02-06 09:07:02 for 642398 stories, total duration: 974s (1.51ms per record)
CALL
``` -->

## Running natively
<!-- 
```
NOTICE:  Start execute_story_chunks for total of 642398 at 2026-02-06 11:10:16
NOTICE:  Running full ANALYZE
NOTICE:  Checking duration for 2000 eventstory records after total seconds: 3
NOTICE:  Checking duration for 5000 eventstory records after total seconds: 7
NOTICE:  Checking duration for 10000 eventstory records after total seconds: 11
NOTICE:  Checking duration for 20000 eventstory records after total seconds: 21
NOTICE:  Checking duration for 30000 eventstory records after total seconds: 30
NOTICE:  Checking duration for 40000 eventstory records after total seconds: 40
NOTICE:  Checking duration for 50000 eventstory records after total seconds: 50
NOTICE:  Checking duration for 60000 eventstory records after total seconds: 59
NOTICE:  Checking duration for 70000 eventstory records after total seconds: 69
NOTICE:  Checking duration for 80000 eventstory records after total seconds: 78
NOTICE:  Checking duration for 90000 eventstory records after total seconds: 88
NOTICE:  Checking duration for 100000 eventstory records after total seconds: 98
NOTICE:  Checking duration for 110000 eventstory records after total seconds: 107
NOTICE:  Checking duration for 120000 eventstory records after total seconds: 117
NOTICE:  Checking duration for 130000 eventstory records after total seconds: 127
NOTICE:  Checking duration for 140000 eventstory records after total seconds: 137
NOTICE:  Checking duration for 150000 eventstory records after total seconds: 146
NOTICE:  Checking duration for 160000 eventstory records after total seconds: 156
NOTICE:  Checking duration for 170000 eventstory records after total seconds: 165
NOTICE:  Checking duration for 180000 eventstory records after total seconds: 175
NOTICE:  Checking duration for 190000 eventstory records after total seconds: 185
NOTICE:  Checking duration for 200000 eventstory records after total seconds: 195
NOTICE:  Checking duration for 210000 eventstory records after total seconds: 205
NOTICE:  Checking duration for 220000 eventstory records after total seconds: 215
NOTICE:  Checking duration for 230000 eventstory records after total seconds: 225
NOTICE:  Checking duration for 240000 eventstory records after total seconds: 235
NOTICE:  Checking duration for 250000 eventstory records after total seconds: 245
NOTICE:  Checking duration for 260000 eventstory records after total seconds: 255
NOTICE:  Checking duration for 270000 eventstory records after total seconds: 264
NOTICE:  Checking duration for 280000 eventstory records after total seconds: 274
NOTICE:  Checking duration for 290000 eventstory records after total seconds: 283
NOTICE:  Checking duration for 300000 eventstory records after total seconds: 293
NOTICE:  Checking duration for 310000 eventstory records after total seconds: 302
NOTICE:  Checking duration for 320000 eventstory records after total seconds: 311
NOTICE:  Checking duration for 330000 eventstory records after total seconds: 320
NOTICE:  Checking duration for 340000 eventstory records after total seconds: 329
NOTICE:  Checking duration for 350000 eventstory records after total seconds: 338
NOTICE:  Checking duration for 360000 eventstory records after total seconds: 347
NOTICE:  Checking duration for 370000 eventstory records after total seconds: 357
NOTICE:  Checking duration for 380000 eventstory records after total seconds: 366
NOTICE:  Checking duration for 390000 eventstory records after total seconds: 375
NOTICE:  Checking duration for 400000 eventstory records after total seconds: 384
NOTICE:  Checking duration for 410000 eventstory records after total seconds: 393
NOTICE:  Checking duration for 420000 eventstory records after total seconds: 403
NOTICE:  Checking duration for 430000 eventstory records after total seconds: 412
NOTICE:  Checking duration for 440000 eventstory records after total seconds: 421
NOTICE:  Checking duration for 450000 eventstory records after total seconds: 430
NOTICE:  Checking duration for 460000 eventstory records after total seconds: 440
NOTICE:  Checking duration for 470000 eventstory records after total seconds: 449
NOTICE:  Checking duration for 480000 eventstory records after total seconds: 458
NOTICE:  Checking duration for 490000 eventstory records after total seconds: 467
NOTICE:  Checking duration for 500000 eventstory records after total seconds: 477
NOTICE:  Checking duration for 510000 eventstory records after total seconds: 486
NOTICE:  Checking duration for 520000 eventstory records after total seconds: 496
NOTICE:  Checking duration for 530000 eventstory records after total seconds: 505
NOTICE:  Checking duration for 540000 eventstory records after total seconds: 514
NOTICE:  Checking duration for 550000 eventstory records after total seconds: 523
NOTICE:  Checking duration for 560000 eventstory records after total seconds: 533
NOTICE:  Checking duration for 570000 eventstory records after total seconds: 542
NOTICE:  Checking duration for 580000 eventstory records after total seconds: 552
NOTICE:  Checking duration for 590000 eventstory records after total seconds: 561
NOTICE:  Checking duration for 600000 eventstory records after total seconds: 571
NOTICE:  Checking duration for 610000 eventstory records after total seconds: 580
NOTICE:  Checking duration for 620000 eventstory records after total seconds: 589
NOTICE:  Checking duration for 630000 eventstory records after total seconds: 599
NOTICE:  Checking duration for 640000 eventstory records after total seconds: 608
NOTICE:  Checking story index 642398 by: SELECT chk.check_eventstory_count(expected_count => 642398)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project A', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project B', expected_j => '[15, 32, 196, 1008, 7560, 12600]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project K', expected_j => '[0]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project L', expected_j => '[1]'::jsonb)
NOTICE:  Checking story index 642398 by: SELECT chk.check_topic_children_counts(root_name => 'Project M', expected_j => '[1]'::jsonb)
NOTICE:  Last eventid: 642480, last executed storyindex: 642398
NOTICE:  Finished execute_story_chunks at 2026-02-06 11:20:27 for 642398 stories, total duration: 611s (0.95ms per record)
CALL
``` -->

### Installation steps

The steps here are more straightforward and mimic the ones described in the corresponding section for the *M4 Max* architecture.