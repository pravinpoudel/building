function convertFile(file) {
    const file_subtext = document.querySelector('.content')
    const fr = new FileReader() as FileReader
    fr.addEventListener(
        'load',
        (e) => {
            // e.target.result;
            let _data = fr.result
            // console.log(_data)
        },
        false
    )
    fr.addEventListener('error', () => {
        console.error('error on reading the file')
    })

    if (file) {
        fr.readAsText(file)
    }
}

export { convertFile }
