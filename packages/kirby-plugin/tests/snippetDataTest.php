<?php

require __DIR__ . '/../index.php';

it('handles snippet props and groups attributes', function() {
  $input = [
    '@myProp' => 123,
    '@myOtherProp' => 'test',
    'class' => 'red',
    'aria-label' => 'text'
  ];

  $output = [
    'myProp' => 123,
    'myOtherProp' => 'test',
    'attr' => [
      'class' => 'red',
      'aria-label' => 'text'
    ],
  ];

  expect(__snippetData($input))->toEqual($output);
});

it('provides an empty attr array', function() {
  $input = ['@prop' => true];
  $output = ['prop' => true, 'attr' => []];
  
  expect(__snippetData($input))->toEqual($output);
});