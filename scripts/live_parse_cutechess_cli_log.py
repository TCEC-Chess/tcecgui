#!/usr/bin/env python3
import chess, sys, os, json, time, re

SLEEP_TIME = 0.1
DEFAULT_DIGITS = 3
LAST_BYTES_SIZE = 100000

SI = ((10**3, "k"),
      (10**6, "M"),
      (10**9, "G"),
      (10**12, "T"),
      (10**15, "P"),
      (10**18, "E"),
      (10**21, "Z"),
      (10**24, "Y"))

SIN = ((10**3, "k"),
      (10**6, "M"),
      (10**9, "B"),
      (10**12, "T"),
      (10**15, "P"),
      (10**18, "E"),
      (10**21, "Z"),
      (10**24, "Y"))

def str_SI(no, digits=DEFAULT_DIGITS, units=SI, postfix=""):
    if postfix:
        gap = " "
    else:
        gap = ""
    last_unit = ""
    last_mag = 1
    for i in range(len(units)):
        mag, unit = units[i]
        if no<mag:
            return "%.*g%s%s%s" % (digits, no/last_mag, gap, last_unit, postfix)
        last_mag, last_unit  = mag, unit
    return "%.*g%s%s%s" % (digits, no/last_mag, gap, last_unit, postfix)

def get_size(filename):
    return os.stat(filename).st_size

def get_start(logfile):
    return open(logfile).read(1024)

if __name__=="__main__":
    while True:
        logfile = sys.argv[1]
        start_kb = get_start(logfile)
        current_size = get_size(logfile)
        if current_size < LAST_BYTES_SIZE: LAST_BYTES_SIZE = current_size
        with open(logfile) as fp:
            fp.seek(current_size - LAST_BYTES_SIZE)
            s = fp.read(LAST_BYTES_SIZE)
            m = re.match(r".*([<>].*position.*)", s, re.DOTALL)
            if m:
                current_size -= len(m.group(1)) + LAST_BYTES_SIZE - len(s)
                if current_size<0: current_size = 0
        b = None
        prev_fen = ""
        prev_move_lst = []
        while True:
            size = get_size(logfile)
            if size < current_size or start_kb != get_start(logfile): #New tournament started
                current_size = 0
                b = None
                continue
            elif size == current_size:
                time.sleep(SLEEP_TIME)
            else:
                try:
                    with open(logfile, "rb") as fp:
                        fp.seek(current_size)
                        for line_bin in fp:
                            if not line_bin: break
                            try:
                                line = line_bin.decode('ascii')
                            except UnicodeDecodeError as e:
                                with open("liveengineeval.log", "a") as fp:
                                    fp.write("line: %s" % (line_bin,))
                                    fp.write("exception: %s\n\n" % (str(e),))
                                current_size += len(line_bin)
                                continue
                            if line[-1]!="\n":
                                time.sleep(SLEEP_TIME)
                                break
                            current_size += len(line_bin)
                            if ":" not in line: continue
                            cs, uci = line.split(":")[:2]
                            m = re.match(r".*[<>](.*?)\(", cs)
                            if not m: continue
                            name = m.group(1)
                            l = uci.split()
                            if len(l)>=3 and l[2] in ("STDIN", "STDOUT", "STDERR", "STATUS"):
                                del l[:3]
                            if l[0]=="cuteseal-deadline":
                                del l[:2]
                            if l[0]=="position":
                                if len(l)>=2 and l[1]=="startpos":
                                    b = chess.Board()
                                    if len(l)>=4 and l[2]=="moves":
                                        for m in l[3:]:
                                            b.push_uci(m)
                            elif l[0]=="info" and b and "pv" in l:
                                move_lst = [chess.Move.from_uci(m) for m in l[l.index("pv")+1:]]
                                fen = b.fen()
                                if fen==prev_fen and len(prev_move_lst) > len(move_lst) and prev_move_lst[:len(move_lst)]==move_lst:
                                    move_lst = prev_move_lst
                                else:
                                    prev_fen = fen
                                    prev_move_lst = move_lst
                                try:
                                    pv_str = b.variation_san(move_lst)
                                except ValueError as e:
                                    with open("liveengineeval.log", "a") as fp:
                                        fp.write("fen: %s\n" % (fen,))
                                        fp.write("line: %s" % (line,))
                                        fp.write("move_lst: %s\n" % (str(move_lst),))
                                        fp.write("exception: %s\n\n" % (str(e),))
                                    pv_str = ""
                                    continue
                                #{"engine": "Stockfish 030519", "eval": 0.63, "pv": "5...g4 6. Nh4 f3 7. Nc3 Be7 8. Be3 Bxh4 9. gxh4 Qxh4+ 10. Kd2 Nc6 11. h3 Nf6 12. Bd3 gxh3 13. Qxf3 Bg4 14. Qf4 Nh5 15. Qh2 O-O-O 16. Rag1 f5 17. exf5 Nf6 18. Qf4 Rhg8 19. Bc4 d5 20. Be2 Qh5 21. Rg3 Bxe2 22. Rgxh3 Qf7 23. Nxe2 Rde8 24. Nc3 h5 25. Kc1 Rg4 26. Qf2 Qg7 27. a3 a6 28. Kb1 Rg2 29. Qf3 Qg4 30. Qxg4 Rxg4 31. Bf2 Nxd4", "depth": "33/56", "speed": "125Mn/s", "tbhits": "26", "nodes": 2905276005}
                                score = depth = seldepth = speed = tbhits = ""
                                nodes = 0
                                time_s = 0.0
                                color = 0
                                fail = 0
                                plynum = len(b.move_stack)
                                if b.turn==chess.BLACK:
                                   color = 1
                                nodes_int = 0
                                for i, token in enumerate(l):
                                    if b.turn==chess.BLACK:
                                        color = 1
                                    if token=="score":
                                        score_no = int(l[i+2])
                                        if b.turn==chess.BLACK: score_no = -score_no
                                        if l[i+1]=="cp":
                                            score = "%.2f" % (score_no/100,)
                                        elif l[i+1]=="mate":
                                            score = "#%i" % (score_no,)
                                    elif token=="depth":
                                        depth = l[i+1]
                                    elif token=="seldepth":
                                        seldepth = l[i+1]
                                    elif token=="nodes":
                                        nodes_int = int(l[i+1])
                                        nodes = str_SI(nodes_int, units=SIN)
                                    elif token=="time":
                                        time_s = int(l[i+1])/1000
                                    elif token=="tbhits":
                                        tbhits = str_SI(int(l[i+1]))
                                    elif token=="nps":
                                        speed = str_SI(int(l[i+1]), postfix="nps")
                                if seldepth:
                                    depth += "/" + seldepth
                                else:
                                    depth += "/" + depth
                                #print(json_str)
                                if not speed and nodes_int and time_s:
                                    speed = str_SI(int(round(nodes_int/time_s)), postfix="nps")
                                if fail == 0 and pv_str:
                                   json_str = json.dumps({"color": color, "engine": name, "eval": score, "pv": pv_str, "depth": depth, "speed": speed, "tbhits": tbhits, "time": time_s, "nodes": nodes, "plynum": plynum})
                                   with open("liveengineeval.json", "w") as fp_out: fp_out.write(json_str + "\n")
                            if current_size >= size:
                                break
                    #current_size = size
                except Exception as e:
                    with open("liveengineeval.log", "a") as fp:
                        fp.write("outside exception: %s\n\n" % (str(e),))
