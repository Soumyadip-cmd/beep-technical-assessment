import './App.css'
import Autocomplete from './autocomplete'

function App() {

  return (
    <>
      <Autocomplete
        label="Test"
        description="Test"
        placeholder="Type something..."
        options={['apple', 'banana', 'orange']}
        renderOption={(option) => <div>{option}</div>}
        onInputChange={(value) => console.log(value)}
        onChange={(value) => console.log(value)}
        filterOptions={(options, state) => {
          return options.filter(option => option.includes(state.inputValue))
        }
        }
        value={['apple']}
        multiple={true}
        loading={true}
        disabled={false}
      />
    </>
  )
}

export default App
