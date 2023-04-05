<?php

use Kirby\Cms\App;

require 'kirby/bootstrap.php';

echo (new App([
  'roots' => [
    'snippets' => __DIR__ . '/site/dist/snippets',
    'templates' => __DIR__ . '/site/dist/templates',
  ]
]))->render();
