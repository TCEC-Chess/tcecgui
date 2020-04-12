TCEC GUI
========

This is the code that powers the
[tcec-chess.com](http://tcec-chess.com/) website.

Setting up a development environment
------------------------------------

1. Git clone --> `$TCECGUI`
2. Run `$TCECGUI/scripts/setup-development.sh`. This does the following:
   * `npm install` to download node_modules packages in tcecgui/tcec-chess.com/
   * Runs `$TCECGUI/scripts/download-tcec-live-files-for-testing.sh` to download live files from the TCEC server
3. Run `$TCECGUI/scripts/start-tcec-chess-live-update.sh` to launch the live update server (CTRL+C to stop)
4. Point your browser to `$TCECGUI/tcec-chess.com/live.html`

This section is incomplete.


Licence
-------

    Copyright 2019-2020 Top Chess Engine Championship organization

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.


Credits
-------

The TCEC GUI is based on the work by Ben Reese and Arun Sathyamurthy,
forked from the [github.com/coolchess123/tceccutechess](https://github.com/coolchess123/tceccutechess)
repository. The original software was provided with the
[ISC](https://www.isc.org/licenses/) and
[Apache 2.0](https://www.apache.org/licenses) licenses.

The source code is currently maintained by the TCEC organization. You
may reach us at the [TCEC Official discord](https://discord.gg/EYuyrDr) channel \#enginedev-lobby.
