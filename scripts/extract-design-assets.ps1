Add-Type -AssemblyName System.Drawing
$referenceDirectory = 'C:/Users/ASUS/Downloads/Final Year Project'
$outputDirectory = Join-Path $PSScriptRoot '../src/assets/reference'
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

# Coordinates use the displayed reference width, then scale to the original PNG.
# Only photographs/illustrations are extracted; page layouts remain HTML and CSS.
function Export-Crop($file, $referenceWidth, $name, $x, $y, $width, $height, $outputWidth = 1600) {
    $source = [System.Drawing.Image]::FromFile((Join-Path $referenceDirectory $file))
    $scale = $source.Width / $referenceWidth
    $outputHeight = [int]($outputWidth * $height / $width)
    $bitmap = [System.Drawing.Bitmap]::new($outputWidth, $outputHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $destination = [System.Drawing.Rectangle]::new(0, 0, $outputWidth, $outputHeight)
    $graphics.DrawImage($source, $destination, [single]($x*$scale), [single]($y*$scale), [single]($width*$scale), [single]($height*$scale), [System.Drawing.GraphicsUnit]::Pixel)
    $bitmap.Save((Join-Path $outputDirectory "$name.jpg"), [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $graphics.Dispose()
    $bitmap.Dispose()
    $source.Dispose()
}

Export-Crop 'About Us.png' 2528 'about-banner' 0 200 2528 190
Export-Crop 'Contact Us.png' 2624 'contact-banner' 0 208 2624 205
Export-Crop 'Our Services.png' 1856 'services-banner' 0 147 1856 140
Export-Crop 'Find Inscription.png' 1888 'archive-banner' 0 151 1888 140
Export-Crop 'Inroduction to Inscription.png' 1202 'introduction-banner' 0 96 1202 90
Export-Crop 'Inroduction to Inscription.png' 1202 'brahmi-alphabet' 231 3880 743 1350 1100
Export-Crop 'Contact Us.png' 2624 'contact-map' 207 1057 1235 657 1200
Export-Crop 'Our Services.png' 1856 'gal-vihara' 265 1055 414 369 650
Export-Crop 'Our Services.png' 1856 'dambulla' 736 1055 414 369 650
Export-Crop 'Our Services.png' 1856 'yapahuwa' 1208 1055 414 369 650
Export-Crop 'Our Services.png' 1856 'avukana' 265 1545 414 369 650
Export-Crop 'Our Services.png' 1856 'sigiriya' 736 1545 414 369 650
Export-Crop 'Our Services.png' 1856 'ruwanwelisaya' 1208 1545 414 369 650
Export-Crop 'Inscription Data.png' 2432 'inscription-77' 335 519 1760 628 1400
