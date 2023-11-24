<?php

use Kirby\Cms\App;

function __snippetData(array $attributes) {
  $data = [];
  $attr = [];
  
  foreach($attributes as $key => $value) {
    if (str_starts_with($key, '$')) {
      $name = substr($key, 1); 
      $data[$name] = $value;
    } else {
      $attr[$key] = $value;
    }
  }

  $data['attr'] = $attr;
  return $data;
}

App::plugin('arnoson/kirby-template-sugar', []);