require 'yaml'
Bundler.require

class Builder
  attr_reader :config

  def initialize config_path
    @config = YAML.load File.read(config_path)
  end

  def build!
    run :compile, "Compiling coffee"
    run :package, "Packaging"
    run :push, "Pushing to device" if config[:push_to_device]
    puts "Done!"
  end

  private

  def run command, *args, description
    puts "#{description}..."
    send command, *args
  end

  def compile
    config[:compile].each do |path|
      sources = CoffeeScript.compile File.read(path), bare: true
      write_path = File.join File.dirname(path), "#{File.basename(path, '.coffee')}.js"
      File.write write_path, sources
    end
  end

  def package
    File.delete package_name if File.exists? package_name
    Zip::File.open(package_name, Zip::File::CREATE) do |zip|
      config[:files].each do |file|
        zip.add file, File.expand_path(file)
      end

      config[:folders].each do |folder|
        Dir[File.join(folder, '**', '*')].each do |file|
          zip.add file, File.expand_path(file)
        end
      end
    end
  end

  def push
    system "adb push ./#{package_name} /sdcard/#{package_name}"
    system <<-COMMAND
      adb shell am start -a android.intent.action.VIEW \
                         -c android.intent.category.DEFAULT \
                         -d file:///mnt/sdcard/#{package_name} \
                         -n #{config[:app_id]}/.App
    COMMAND
  end

  def package_name
    "#{config[:name]}.xpi"
  end
end

Builder.new('build_config.yml').build!