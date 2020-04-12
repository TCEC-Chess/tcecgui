#!/usr/bin/perl

use JSON;
use Data::Dumper;
use Scalar::Util qw(looks_like_number);
use Getopt::Long qw(GetOptions);

my $tag = '';
my $loc = '';
my $cup = 0;
my $eve = '';
my $prevpgn = 0;
my $pwd = 0;
my $zipFileWhole = 0;
my $archDir = "/var/www/json/archive";
my $games = 0;
my $crossGames = 0;
my $resume = 0;
my $frc = 1;

GetOptions('tag=s' => \$tag,
           'ful=s' => \$ful,
           'loc=s' => \$loc,
           'eve=s' => \$eve,
           'games=s' => \$games,
           'cup=i' => \$cup,
           'resume=i' => \$resume,
           'pwd=s' => \$pwd,
           'crossgames=i' => \$crossGames,
           'prevpgn=s' => \$prevpgn,
           'frc' => \$frc
           ) or die "Usage: $0 --from NAME\n";

print "perl::::::::::::: $tag, $eve, $ful, $loc\n";

my $zipFile = $tag.".pgn.zip";
my $pgnFile = $tag.".pgn";
my $pgnLinkFile = $tag."_link.pgn";
my $eventPgnFile = $eve.".pgn";
my $eventTag = $eve;
my @fileArray = ();
push (@fileArray, $pgnFile);

foreach my $file (sort @fileArray)
{
   my $season = 0;
   my $seasonNo = 0;
   my $division = '';
   my $url = '';

   if ($file =~ m/TCEC_Season_(.*)_-_(.*).pgn$/)
   {
       $season = $1;
       $seasonNo = $1;
       $division = $2;
       $menu = "$division";
       $id = "s".$seasonNo.$menu;   
       $url = "season=".$seasonNo.'&'."div=".$division;
   }
   if ($file =~ m/TCEC_Season_(.*)_-_Division_(.*).pgn$/)
   {
       $season = $1;
       $seasonNo = $1;
       $division = $2;
       $menu = "Division $division";
       $id = "s".$seasonNo.$menu;   
       $url = "season=".$seasonNo.'&'."div=".$division;
   }

   if ($file =~ m/TCEC_Season_(.*)_-_Superfinal.pgn$/)
   {
       $season = $1;
       $seasonNo = $1;
       $menu = "Superfinal";
       $division = 'sf';
       $id = "s".$seasonNo."Division $division";
       $url = "season=".$seasonNo.'&'."div=".$division;
   }

   if ($file =~ m/TCEC_Season_(.*)_-_Elite-Match.pgn$/)
   {
       $season = $1;
       $seasonNo = $1;
       $division = 'sf';
       $menu = "Superfinal";
       $id = "s".$seasonNo."Division $division";
       $url = "season=".$seasonNo.'&'."stage=".$division;
   }
   if ($file =~ m/TCEC_Season_(.*?)_-_Stage_(.*?).pgn$/)
   {
       $season = $1;
       $seasonNo = $1;
       $division = $2;
       $menu = "Stage $division";
       $id = "s".$seasonNo.$menu;   
       $url = "season=".$seasonNo.'&'."stage=".$division;
   }
   if ($url eq '')
   {
      next;
   }

   if ($file =~ m/\s/)
   {
      #removeSpace($file);
   }
   if ($file =~ m/(.*).pgn/)
   {
      $title = $1;
   }
   if ($file =~ m/TCEC_Season_(.*?)_.*/)
   {
      $downloadFile = "TCEC_Season_$1";
   }
   $id = lc $id;
   $url = lc $url;
   $id =~ s/\s//g;
   my $entry = {
                "id"     => "$id",
                "no"     => $seasonNo,
                "dno"    => $division,
                "menu"   => $menu,
                "url"    => $url,
                "abb"    => "$title"
               };
   my @array = ();
   if (%hash &&
       exists $hash{"Seasons"}{"$season"}{"sub"})
   {
      @array = @{$hash{"Seasons"}{"$season"}{"sub"}};
      #print "Adding entry $id\n";
   }
   push (@array, $entry);
   $hash{"Seasons"}{"$season"}{"sub"} = \@array;
   $hash{"Seasons"}{"$season"}{"download"} = "$downloadFile"."_full.pgn.zip";
}

sub byname
{
   $a->{"dno"} <=> $b->{"dno"};# presuming numeric
}

$json = JSON->new->allow_nonref;
$json_text   = $json->encode( \%hash);
$perl_scalar = $json->decode( $json_text );
$pretty_printed = $json->pretty->encode( $perl_scalar ); # pretty-printing
print "$pretty_printed\n";

chdir($archDir);
if (-r $pgnLinkFile)
{
   system ("cp -L $pgnLinkFile $pgnFile");
   print "XXXXXXXXXXXXXX: Copying link $pgnLinkFile to original file $pgnFile\n";
}

system ("zip $zipFile $pgnFile");
if (defined($ful))
{
   system ("zip $ful $pgnFile");
}

if ($cup)
{
   if ($prevpgn)
   {
      my $prevStr = join(' ', split ( /,/, $prevpgn));
      system ("cat $prevStr > $eventPgnFile");
      print ("cat $prevStr > $eventPgnFile\n");
   }
}

system ("node /var/www/archive.tcec-chess.com/dist/js/sched2.js --filename \'$pgnFile\' --tag \'$loc\' --force 1 --crossgames $crossGames");
print("node /var/www/archive.tcec-chess.com/dist/js/sched2.js --filename \'$pgnFile\' --tag \'$loc\' --force 1 -crossgames $crossGames\n");

if ($cup && $pwd)
{
   my $schedFile = $archDir . "/" . $tag . "_Schedule.sjson";
   my $eventFile = $archDir . "/" . $eventTag. "_Eventcrosstable.cjson";
   system ("ln -fs $schedFile $pwd/schedule.json");
   system ("ln -fs $eventFile $pwd/Eventcrosstable.json");
   print ("ln -fs $schedFile $pwd/schedule.json\n");
   print ("ln -fs $schedFile $pwd/Eventcrosstable.json\n");
}
elsif ($resume)
{
   my $schedFile = $archDir . "/" . $tag . "_Schedule.sjson";
   print ("ln -fs $schedFile $pwd/schedule.json\n");
   system ("ln -fs $schedFile $pwd/schedule.json");
   my $crossFile = $archDir . "/" . $tag . "_Crosstable.cjson";
   print ("ln -fs $crossFile $pwd/crosstable.json\n");
   system ("ln -fs $crossFile $pwd/crosstable.json");
}
elsif ($pwd)
{
   my $schedFile = $pwd. "/" . "/json/schedule.json";
   print ("ln -fs $schedFile $pwd/schedule.json\n");
   system ("ln -fs $schedFile $pwd/schedule.json");
   my $crossFile = $pwd. "/". "/json/crosstable.json";
   print ("ln -fs $crossFile $pwd/crosstable.json\n");
   system ("ln -fs $crossFile $pwd/crosstable.json");
}

my $frcPerl = '';

if ($frc)
{
   $frcPerl = ' --frc ';   
}

system ("node /var/www/archive.tcec-chess.com/dist/js/pgnjb.js $frcPerl --games $games --filename \'$pgnFile\' --tag \'$loc\'");
system ("cp /var/www/json/shared/enginerating.json $archDir/$tag"."_Enginerating.egjson");
system ("cp /var/www/json/shared/ordo.txt $archDir/$tag"."_.ordo.txt");
system ("cp /var/www/json/main/crash.json $archDir/$tag"."_crash.xjson");
if ($cup)
{
   #system ("node /var/www/archive.tcec-chess.com/dist/js/crosscup.js --filename \'$eventPgnFile\' --tag \'$loc\' --outfile \'$eventTag\' --force 1");
   #print ("node /var/www/archive.tcec-chess.com/dist/js/crosscup.js --filename \'$eventPgnFile\' --tag \'$loc\' --force 1\n");
   system ("node /var/www/archive.tcec-chess.com/dist/js/crosscupnew.js --filename \'$eventPgnFile\' --tag \'$loc\' --outfile \'$eventTag\' --force 1 --cup 1");
   print ("node /var/www/archive.tcec-chess.com/dist/js/crosscupnew.js --filename \'$eventPgnFile\' --tag \'$loc\' --outfile \'$eventTag\' --force 1 --cup 1\n");
}
else
{
   system ("node /var/www/archive.tcec-chess.com/dist/js/crosscupnew.js --filename \'$pgnFile\' --tag \'$loc\' --force 1 --cup 0 --crossgames $crossGames");
   print ("node /var/www/archive.tcec-chess.com/dist/js/crosscupnew.js --filename \'$pgnFile\' --tag \'$loc\' --force 1 --cup 0 --crossgames $crossGames\n");
   #system ("node /var/www/archive.tcec-chess.com/dist/js/cross2.js --filename \'$pgnFile\' --tag \'$loc\' --force 1");
}
print ("node /var/www/archive.tcec-chess.com/dist/js/pgnjb.js --games $games --filename \'$pgnFile\' --tag \'$loc\'\n");
